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

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "Unauthorized", message: "No refresh token" }, { status: 401 });
    }

    const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Rotation failure or reuse detection triggered: clear cookies immediately
      cookieStore.delete(ACCESS_TOKEN_COOKIE);
      cookieStore.delete(REFRESH_TOKEN_COOKIE);
      cookieStore.delete(USER_ROLE_COOKIE);

      return NextResponse.json(
        { error: data.error || "Unauthorized", message: data.message || "Session expired" },
        { status: 401 },
      );
    }

    const { accessToken, refreshToken: newRefreshToken, user } = data;

    // Set updated rotated cookies
    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
    cookieStore.set(REFRESH_TOKEN_COOKIE, newRefreshToken, refreshTokenCookieOptions);
    cookieStore.set(USER_ROLE_COOKIE, user.role, userRoleCookieOptions);

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: "Server Error", message }, { status: 500 });
  }
}
