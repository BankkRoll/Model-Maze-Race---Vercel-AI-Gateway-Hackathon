/**
 * OAuth callback endpoint
 * Exchanges authorization code for tokens and stores them
 *
 * @module auth/callback
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

interface TokenData {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  scope: string;
  refresh_token: string;
}

/**
 * Validates state and nonce values
 *
 * @param value - Value to validate
 * @param storedValue - Stored value to compare against
 * @returns Whether values match
 */
function validate(
  value: string | null,
  storedValue: string | undefined,
): boolean {
  if (!value || !storedValue) {
    return false;
  }
  return value === storedValue;
}

/**
 * Decodes nonce from ID token
 *
 * @param idToken - The ID token JWT
 * @returns The nonce value
 */
function decodeNonce(idToken: string): string {
  try {
    const payload = idToken.split(".")[1];
    const decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
    const nonceMatch = decodedPayload.match(/"nonce":"([^"]+)"/);
    return nonceMatch ? nonceMatch[1] : "";
  } catch {
    return "";
  }
}

/**
 * Exchanges authorization code for tokens
 *
 * @param code - Authorization code from Vercel
 * @param codeVerifier - PKCE code verifier
 * @param requestOrigin - Origin of the request
 * @returns Token data
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string | undefined,
  requestOrigin: string,
): Promise<TokenData> {
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
  const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("OAuth not configured");
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    code_verifier: codeVerifier || "",
    redirect_uri: `${requestOrigin}/api/auth/callback`,
  });

  const response = await fetch("https://api.vercel.com/login/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to exchange code for token: ${JSON.stringify(errorData)}`,
    );
  }

  return await response.json();
}

/**
 * Sets authentication cookies
 *
 * @param tokenData - Token data to store
 */
async function setAuthCookies(tokenData: TokenData) {
  const cookieStore = await cookies();

  cookieStore.set("access_token", tokenData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokenData.expires_in,
  });

  cookieStore.set("refresh_token", tokenData.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  cookieStore.set("id_token", tokenData.id_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokenData.expires_in,
  });
}

/**
 * GET handler for OAuth callback
 * Validates state/nonce, exchanges code for tokens, and redirects
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/?auth_error=${encodeURIComponent(error)}`, request.url),
      );
    }

    if (!code) {
      throw new Error("Authorization code is required");
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get("oauth_state")?.value;
    const storedNonce = cookieStore.get("oauth_nonce")?.value;
    const codeVerifier = cookieStore.get("oauth_code_verifier")?.value;

    if (!validate(state, storedState)) {
      throw new Error("State mismatch");
    }

    const tokenData = await exchangeCodeForToken(
      code,
      codeVerifier,
      request.nextUrl.origin,
    );

    const decodedNonce = decodeNonce(tokenData.id_token);

    if (!validate(decodedNonce, storedNonce)) {
      throw new Error("Nonce mismatch");
    }

    await setAuthCookies(tokenData);

    cookieStore.set("oauth_state", "", { maxAge: 0 });
    cookieStore.set("oauth_nonce", "", { maxAge: 0 });
    cookieStore.set("oauth_code_verifier", "", { maxAge: 0 });

    return NextResponse.redirect(new URL("/?auth_success=1", request.url));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/?auth_error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unknown error",
        )}`,
        request.url,
      ),
    );
  }
}
