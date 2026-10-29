import { cookies } from "next/headers";
import createClient from "openapi-fetch";
import type { paths } from "./schema";

const INTERNAL_API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000";

/**
 * Server-side typed API client for Server Components, Server Actions, and Route Handlers.
 * Automatically injects the httpOnly access token stored in user cookies.
 */
export async function getServerApiClient() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("eventpass_access_token")?.value;

  return createClient<paths>({
    baseUrl: INTERNAL_API_URL,
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : {},
  });
}
