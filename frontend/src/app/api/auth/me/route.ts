import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  userRoleCookieOptions,
} from "@/lib/auth/cookies";

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ user: null });
    }

    // If access token is missing but refresh token exists, attempt transparent refresh
    if (!accessToken && refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        cookieStore.delete(ACCESS_TOKEN_COOKIE);
        cookieStore.delete(REFRESH_TOKEN_COOKIE);
        cookieStore.delete(USER_ROLE_COOKIE);
        return NextResponse.json({ user: null });
      }

      const refreshed = await refreshRes.json();
      accessToken = refreshed.accessToken;
      cookieStore.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, accessTokenCookieOptions);
      cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, refreshTokenCookieOptions);
      cookieStore.set(USER_ROLE_COOKIE, refreshed.user.role, userRoleCookieOptions);

      return NextResponse.json({ user: refreshed.user });
    }

    // Try fetching user with current access token
    const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (res.ok) {
      const user = await res.json();
      return NextResponse.json({ user });
    }

    // If 401 Unauthorized and refresh token exists, attempt refresh
    if (res.status === 401 && refreshToken) {
      const refreshRes = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        cookieStore.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, accessTokenCookieOptions);
        cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, refreshTokenCookieOptions);
        cookieStore.set(USER_ROLE_COOKIE, refreshed.user.role, userRoleCookieOptions);
        return NextResponse.json({ user: refreshed.user });
      }
    }

    // Token invalid or revoked
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    cookieStore.delete(USER_ROLE_COOKIE);
    return NextResponse.json({ user: null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: "Server Error", message }, { status: 500 });
  }
}
