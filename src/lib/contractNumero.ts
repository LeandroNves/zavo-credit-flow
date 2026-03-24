import type { Cliente } from "@/data/mockData";

const MAX_LEN = 120;

/** Ex.: "395-2025" → "#395-2025"; vazio usa fallback (ex.: auto-gerado). */
export function resolveContractNumero(userInput: string, fallback: string): string {
  const t = userInput.trim();
  if (!t) return fallback;
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return withHash.slice(0, MAX_LEN);
}

/** Valor para colocar no input (sem # inicial, opcional). */
export function contractNumeroForInput(stored: string): string {
  return stored.replace(/^#/, "").trim();
}

export function isContractNumeroTaken(
  client: Cliente,
  numero: string,
  excludeContractId?: string,
): boolean {
  const n = numero.toLowerCase();
  return client.contratos.some(
    (c) =>
      c.id !== excludeContractId && c.numero.toLowerCase() === n,
  );
}
