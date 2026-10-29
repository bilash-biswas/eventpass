import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ROLE_COOKIE,
} from "./lib/auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const userRole = request.cookies.get(USER_ROLE_COOKIE)?.value;

  const isAuthenticated = Boolean(accessToken || refreshToken);

  // 1. Guest routes (/login, /register) — redirect away if already logged in
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (isAuthenticated) {
      const redirectUrl =
        userRole === "ORGANIZER" || userRole === "ADMIN" ? "/dashboard" : "/events";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // 2. Protected routes (/dashboard, /my-tickets)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/my-tickets")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role check for organizer dashboard
    if (pathname.startsWith("/dashboard")) {
      if (userRole && userRole !== "ORGANIZER" && userRole !== "ADMIN") {
        return NextResponse.redirect(
          new URL("/events?error=organizer_only", request.url),
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-tickets/:path*",
    "/login",
    "/register",
  ],
};
