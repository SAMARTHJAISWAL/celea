/**
 * Signed invite cookie helpers.
 *
 * Uses Web Crypto HMAC-SHA256 so the same code runs in the Next.js proxy
 * (middleware) and in route handlers.
 */

export const INVITE_COOKIE_NAME = "celea_invite_verified";

// 30 days in seconds
export const INVITE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

const DEV_FALLBACK_SECRET = "celea-dev-only-secret";

/**
 * Returns the secret used to sign invite cookies, or null when none is
 * configured in production (callers must then fail closed).
 */
export function getInviteSecret(
  env: Record<string, string | undefined> = process.env
): string | null {
  const secret = env.INVITE_SECRET?.trim();
  if (secret) return secret;
  if (env.NODE_ENV === "production") return null;
  return DEV_FALLBACK_SECRET;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

async function hmac(value: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Random session token (hex). */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Returns `value.signature`. */
export async function signCookieValue(value: string, secret: string): Promise<string> {
  return `${value}.${await hmac(value, secret)}`;
}

/** Verifies a `value.signature` cookie produced by signCookieValue. */
export async function verifyCookieValue(
  cookieValue: string,
  secret: string
): Promise<boolean> {
  const parts = cookieValue.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [value, signature] = parts;
  return constantTimeEqual(signature, await hmac(value, secret));
}
