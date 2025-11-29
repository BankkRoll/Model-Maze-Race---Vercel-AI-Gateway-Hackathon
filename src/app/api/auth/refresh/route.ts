/**
 * Token refresh endpoint
 * Exchanges refresh token for new access token
 *
 * @module auth/refresh
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

/**
 * POST handler for token refresh
 * Exchanges refresh token for new access and refresh tokens
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token available" },
        { status: 401 },
      );
    }

    const clientId = process.env.NEXT_PUBLIC_VERCEL_APP_CLIENT_ID;
    const clientSecret = process.env.VERCEL_APP_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "OAuth not configured" },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
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
      cookieStore.set("access_token", "", { maxAge: 0 });
      cookieStore.set("refresh_token", "", { maxAge: 0 });
      cookieStore.set("id_token", "", { maxAge: 0 });

      return NextResponse.json(
        { error: `Token refresh failed: ${JSON.stringify(errorData)}` },
        { status: response.status },
      );
    }

    const tokenData: TokenData = await response.json();

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
