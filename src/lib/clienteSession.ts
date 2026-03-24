import { isSupabaseConfigured } from "@/lib/supabaseClient";

const KEY = "zavo_cliente_atual";

/**
 * ID em `clients` para a área `/cliente`.
 * Com Supabase: só após login aprovado (null até lá).
 * Sem Supabase: fallback "1" para o mock João.
 */
export function getClienteAtualId(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v) return v;
  } catch {
    /* ignore */
  }
  return isSupabaseConfigured ? null : "1";
}

export function setClienteAtualId(id: string) {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearClienteAtualId() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
