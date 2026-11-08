/**
 * Invite Code System - server-side only.
 *
 * Valid codes are read from the INVITE_CODES environment variable
 * (comma-separated, 6 alphanumeric characters each, case-insensitive).
 * Nothing is hard-coded in source.
 */

const CODE_PATTERN = /^[A-Z0-9]{6}$/;

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().trim();
}

/** Parses a comma-separated INVITE_CODES value into a set of valid codes. */
export function parseInviteCodes(raw: string | undefined): Set<string> {
  const codes = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    const code = normalizeInviteCode(part);
    if (CODE_PATTERN.test(code)) codes.add(code);
  }
  return codes;
}

/**
 * Verify if an invite code is valid.
 * `raw` defaults to process.env.INVITE_CODES.
 */
export function verifyInviteCode(
  code: unknown,
  raw: string | undefined = process.env.INVITE_CODES
): boolean {
  if (!code || typeof code !== "string") return false;
  const normalized = normalizeInviteCode(code);
  if (!CODE_PATTERN.test(normalized)) return false;
  return parseInviteCodes(raw).has(normalized);
}
