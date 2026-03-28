import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

const globalForSupabase = globalThis as typeof globalThis & {
  __zavo_supabase_client__?: SupabaseClient | null;
};

function getOrCreateSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (globalForSupabase.__zavo_supabase_client__) {
    return globalForSupabase.__zavo_supabase_client__;
  }
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  });
  globalForSupabase.__zavo_supabase_client__ = client;
  return client;
}

/** Uma instância por contexto (evita aviso "Multiple GoTrueClient" com HMR ou chunks duplicados). */
export const supabase: SupabaseClient | null = getOrCreateSupabase();
