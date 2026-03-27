import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "admin_session";
const SESSION_MS = 8 * 60 * 60 * 1000; // 8h

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signPayload(secret: string, payload: string): string {
  const sig = createHmac("sha256", secret).update(payload).digest();
  return `${b64url(Buffer.from(payload, "utf8"))}.${b64url(sig)}`;
}

function verifyToken(secret: string, token: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return false;
  const payloadB64 = token.slice(0, dot);
  let payload: string;
  try {
    payload = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
  } catch {
    return false;
  }
  const expected = signPayload(secret, payload);
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseSessionCookie(
  secret: string,
  cookieHeader: string | undefined,
): { ok: boolean; expired?: boolean } {
  if (!secret || !cookieHeader) return { ok: false };
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return { ok: false };
  if (!verifyToken(secret, token)) return { ok: false };
  const dot = token.lastIndexOf(".");
  if (dot < 0) return { ok: false };
  const payloadB64 = token.slice(0, dot);
  let payload: { exp: number; v: number };
  try {
    const raw = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    payload = JSON.parse(raw) as { exp: number; v: number };
  } catch {
    return { ok: false };
  }
  if (payload.v !== 1 || typeof payload.exp !== "number") return { ok: false };
  if (Date.now() > payload.exp) return { ok: false, expired: true };
  return { ok: true };
}

function parseCookieHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    const v = decodeURIComponent(part.slice(idx + 1).trim());
    out[k] = v;
  }
  return out;
}

export function buildSessionCookieValue(secret: string): string {
  const exp = Date.now() + SESSION_MS;
  const payload = JSON.stringify({ v: 1, exp, jti: b64url(randomBytes(16)) });
  return signPayload(secret, payload);
}

export function serializeSessionSetCookie(
  value: string,
  opts: { secure: boolean; maxAgeSec: number },
): string {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${opts.maxAgeSec}`,
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function serializeSessionClearCookie(opts: { secure: boolean }): string {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export { COOKIE_NAME };
