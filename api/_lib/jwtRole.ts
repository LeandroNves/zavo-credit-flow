import { Buffer } from "node:buffer";

/**
 * Lê o claim `role` do JWT do Supabase (anon | authenticated | service_role).
 * Não valida assinatura — só inspeção para mensagens de configuração no servidor.
 */
export function getSupabaseJwtRole(jwt: string): string | null {
  const t = jwt.replace(/\r/g, "").trim();
  if (!t) return null;
  const parts = t.split(".");
  if (parts.length < 2) return null;
  const payloadB64 = parts[1];
  try {
    const json = Buffer.from(payloadB64, "base64url").toString("utf8");
    const o = JSON.parse(json) as { role?: string };
    return typeof o.role === "string" ? o.role : null;
  } catch {
    try {
      const pad = payloadB64.length % 4 === 0 ? "" : "=".repeat(4 - (payloadB64.length % 4));
      const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/") + pad;
      const json = Buffer.from(normalized, "base64").toString("utf8");
      const o = JSON.parse(json) as { role?: string };
      return typeof o.role === "string" ? o.role : null;
    } catch {
      return null;
    }
  }
}
