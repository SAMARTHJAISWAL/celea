/**
 * Allow-list for media URLs the server will download (reference images,
 * generated videos). Prevents the API from being used to fetch arbitrary
 * URLs (SSRF).
 */

const GOOGLE_AI_HOST = "generativelanguage.googleapis.com";

export function allowedMediaHosts(
  env: Record<string, string | undefined> = process.env
): string[] {
  const hosts = [GOOGLE_AI_HOST];
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      hosts.push(new URL(supabaseUrl).hostname);
    } catch {
      // ignore malformed value
    }
  }
  return hosts;
}

export function isAllowedMediaUrl(
  value: string,
  hosts: string[] = allowedMediaHosts()
): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && hosts.includes(url.hostname);
}
