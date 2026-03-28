import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isCatalogSupabaseConfigured = Boolean(url && anonKey);

/**
 * Cliente só com a chave anon, sem ler o storage de Auth do app.
 * Assim o catálogo público (landing, painel do cliente, lista no admin) não depende
 * de JWT de usuário (evita 401 com sessão expirada → lista vazia).
 */
const memoryStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const catalogSupabase: SupabaseClient | null = isCatalogSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: memoryStorage as Storage,
      },
    })
  : null;
