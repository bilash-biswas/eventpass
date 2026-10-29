import { cookies } from "next/headers";
import { getServerApiClient } from "../api/server-client";

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

/**
 * Retrieves the current authenticated user session from server-side cookies.
 * Calls GET /v1/users/me against the NestJS API with the access token.
 */
export async function getSession(): Promise<Session> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("eventpass_access_token")?.value;

  if (!accessToken) {
    return { user: null };
  }

  try {
    const client = await getServerApiClient();
    const response = await client.GET("/v1/users/me");

    if (response.error || !response.data) {
      return { user: null };
    }

    const userData = response.data;
    return {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
      accessToken,
    };
  } catch {
    return { user: null };
  }
}
