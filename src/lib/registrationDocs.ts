import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "registration-docs";

export function getRegistrationDocPublicUrl(
  client: SupabaseClient,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
