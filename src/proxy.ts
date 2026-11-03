import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  INVITE_COOKIE_NAME,
  getInviteSecret,
  verifyCookieValue,
} from "@/lib/invite-cookie";

// API routes reachable without an invite cookie:
// - verify-invite / waitlist are used by the invite page itself
// - admin routes check ADMIN_API_KEY themselves
// - inngest requests are signed by Inngest (INNGEST_SIGNING_KEY)
const PUBLIC_API_PREFIXES = [
  "/api/verify-invite",
  "/api/waitlist",
  "/api/admin/",
  "/api/inngest",
];

function deny(request: NextRequest, clearCookie: boolean) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");
  const response = isApi
    ? NextResponse.json({ success: false, error: "Invite required" }, { status: 401 })
    : NextResponse.redirect(new URL("/invite", request.url));
  if (clearCookie) response.cookies.delete(INVITE_COOKIE_NAME);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(INVITE_COOKIE_NAME)?.value;
  if (!cookie) return deny(request, false);

  const secret = getInviteSecret();
  if (!secret) {
    console.error("INVITE_SECRET is not set; refusing access to protected routes");
    return deny(request, false);
  }

  if (!(await verifyCookieValue(cookie, secret))) {
    // Invalid or tampered cookie
    return deny(request, true);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/projects/:path*", "/api/:path*"],
};
