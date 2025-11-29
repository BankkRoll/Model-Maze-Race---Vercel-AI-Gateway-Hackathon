/**
 * Sign out endpoint
 * Clears authentication cookies
 *
 * @module auth/signout
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * POST handler for sign out
 * Clears all authentication cookies
 */
export async function POST() {
  const cookieStore = await cookies();

  cookieStore.set("access_token", "", { maxAge: 0 });
  cookieStore.set("refresh_token", "", { maxAge: 0 });
  cookieStore.set("id_token", "", { maxAge: 0 });

  return NextResponse.json({ success: true });
}
