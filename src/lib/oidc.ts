/**
 * OIDC authentication utilities
 * Handles OIDC token management and validation
 *
 * @module oidc
 */

import { cookies } from "next/headers";

/**
 * Gets the OIDC access token from cookies (server-side only)
 * This should only be called from Server Components or API routes
 *
 * @returns The access token or null if not available
 */
export async function getOidcToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    /**
     * Client-side: tokens are in httpOnly cookies, not accessible
     */
    return null;
  }

  try {
    const cookieStore = await cookies();
    return cookieStore.get("access_token")?.value || null;
  } catch {
    return null;
  }
}

/**
 * Checks if OIDC authentication is configured
 *
 * @returns Whether OIDC is configured
 */
export function isOidcConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID &&
    process.env.VERCEL_APP_CLIENT_SECRET
  );
}

/**
 * Refreshes the OIDC access token
 * Should be called when the access token expires
 *
 * @returns Promise resolving to new access token or null if refresh failed
 */
export async function refreshOidcToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
    });

    if (!response.ok) {
      return null;
    }

    /**
     * Token is now in httpOnly cookie, return success indicator
     */
    return "refreshed";
  } catch {
    return null;
  }
}
