import { NextRequest, NextResponse } from "next/server";
import { verifyInviteCode } from "@/lib/invite-codes";
import {
  INVITE_COOKIE_MAX_AGE,
  INVITE_COOKIE_NAME,
  generateSessionToken,
  getInviteSecret,
  signCookieValue,
} from "@/lib/invite-cookie";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code } = body as { code?: unknown };

    const secret = getInviteSecret();
    if (!secret) {
      console.error("INVITE_SECRET is not set; invite verification disabled");
      return NextResponse.json(
        { success: false, error: "Invites are not configured" },
        { status: 503 }
      );
    }

    if (!verifyInviteCode(code)) {
      // Small delay to slow down brute force
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json(
        { success: false, error: "Invalid invite code" },
        { status: 401 }
      );
    }

    const signedValue = await signCookieValue(generateSessionToken(), secret);

    const response = NextResponse.json({
      success: true,
      message: "Welcome to Celea!",
    });

    response.cookies.set(INVITE_COOKIE_NAME, signedValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: INVITE_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error verifying invite code:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
