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
import { loginSchema } from "@/lib/validations/auth.schema";

const API_BASE_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 },
      );
    }

    const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: data.error || "Login Failed",
          message: data.message || "Invalid credentials",
        },
        { status: res.status },
      );
    }

    const { accessToken, refreshToken, user } = data;

    // Set secure httpOnly cookies
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions);
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions);
    cookieStore.set(USER_ROLE_COOKIE, user.role, userRoleCookieOptions);

    return NextResponse.json({ user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: "Server Error", message }, { status: 500 });
  }
}
