import createClient from "openapi-fetch";
import type { paths } from "./schema";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

/**
 * Browser-side typed API client using openapi-fetch.
 * In the browser, cookies are attached automatically by the browser with credentials: "include".
 */
export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: "include",
});

export type ApiPaths = paths;
