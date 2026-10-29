import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const ACCESS_TOKEN_COOKIE = "eventpass_access_token";
export const REFRESH_TOKEN_COOKIE = "eventpass_refresh_token";
export const USER_ROLE_COOKIE = "eventpass_user_role";

const isProduction = process.env.NODE_ENV === "production";

export const accessTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60, // 15 minutes
};

export const refreshTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export const userRoleCookieOptions: Partial<ResponseCookie> = {
  httpOnly: false, // Accessible to client-side JS as an optimistic UI hint
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};
