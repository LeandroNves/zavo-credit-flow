import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "registration-docs";

/** Aceita um path único (legado) ou JSON `["p1","p2"]` gravado no perfil. */
export function parseStoredDocPaths(raw: string | null | undefined): string[] {
  if (raw == null || String(raw).trim() === "") return [];
  const t = String(raw).trim();
  if (t.startsWith("[")) {
    try {
      const a = JSON.parse(t) as unknown;
      if (Array.isArray(a)) {
        return a.filter((x): x is string => typeof x === "string" && x.length > 0);
      }
    } catch {
      return [];
    }
  }
  return [t];
}

export function storeDocPathsForProfile(paths: string[]): string | null {
  if (paths.length === 0) return null;
  if (paths.length === 1) return paths[0]!;
  return JSON.stringify(paths);
}

export function getRegistrationDocPublicUrl(
  client: SupabaseClient,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function getRegistrationDocPublicUrls(
  client: SupabaseClient,
  raw: string | null | undefined,
): string[] {
  return parseStoredDocPaths(raw)
    .map((p) => getRegistrationDocPublicUrl(client, p))
    .filter((u): u is string => Boolean(u));
}
