/**
 * OAuth authorization endpoint
 * Redirects users to Vercel's OAuth consent page
 *
 * @module auth/authorize
 */

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * Generates a secure random string for OAuth state/nonce
 *
 * @param length - Length of the string to generate
 * @returns Secure random string
 */
function generateSecureRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes, (byte) => charset[byte % charset.length]).join(
    "",
  );
}

/**
 * GET handler for OAuth authorization
 * Generates PKCE parameters and redirects to Vercel's authorization endpoint
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error: "OAuth not configured. Missing NEXT_PUBLIC_VERCEL_APP_CLIENT_ID",
      },
      { status: 500 },
    );
  }

  const state = generateSecureRandomString(43);
  const nonce = generateSecureRandomString(43);
  const codeVerifier = crypto.randomBytes(43).toString("hex");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  const cookieStore = await cookies();

  cookieStore.set("oauth_state", state, {
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  cookieStore.set("oauth_nonce", nonce, {
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  cookieStore.set("oauth_code_verifier", codeVerifier, {
    maxAge: 10 * 60,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  });

  const queryParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${req.nextUrl.origin}/api/auth/callback`,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    response_type: "code",
    scope: "openid email profile offline_access",
  });

  const authorizationUrl = `https://vercel.com/oauth/authorize?${queryParams.toString()}`;
  return NextResponse.redirect(authorizationUrl);
}
