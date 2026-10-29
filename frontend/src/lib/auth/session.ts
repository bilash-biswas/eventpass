import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  userRoleCookieOptions,
} from "./cookies";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ORGANIZER" | "ADMIN";
}

export interface Session {
  user: SessionUser | null;
  accessToken?: string;
}

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

/**
 * Retrieves the current authenticated user session from server-side cookies.
 * If the access token has expired but a valid refresh token exists, it automatically
 * rotates the refresh token and sets the new access token in cookies.
 */
export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return { user: null };
  }

  // If access token is missing but refresh token exists, attempt refresh
  if (!accessToken && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        accessToken = refreshed.accessToken;
        cookieStore.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, accessTokenCookieOptions);
        cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, refreshTokenCookieOptions);
        cookieStore.set(USER_ROLE_COOKIE, refreshed.user.role, userRoleCookieOptions);

        return {
          user: refreshed.user,
          accessToken: refreshed.accessToken,
        };
      }
    } catch {
      return { user: null };
    }
  }

  // Validate existing access token with GET /v1/users/me
  try {
    const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const user = await res.json();
      return { user, accessToken };
    }

    // Access token expired, attempt refresh with refreshToken
    if (res.status === 401 && refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        cookieStore.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, accessTokenCookieOptions);
        cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, refreshTokenCookieOptions);
        cookieStore.set(USER_ROLE_COOKIE, refreshed.user.role, userRoleCookieOptions);

        return {
          user: refreshed.user,
          accessToken: refreshed.accessToken,
        };
      }
    }

    return { user: null };
  } catch {
    return { user: null };
  }
}
