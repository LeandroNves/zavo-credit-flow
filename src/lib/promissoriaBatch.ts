import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { buildPromissoriaDocumentVars } from "@/lib/documentVars";

/** Promissórias por folha no modelo Word (3-up). */
export const PROMISSORIAS_PER_PAGE = 3;

const SLOT_PREFIXES = ["s1", "s2", "s3"] as const;

export function chunkArray<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function prefixVars(
  prefix: string,
  vars: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    out[`${prefix}_${k}`] = v;
  }
  return out;
}

export type PromissoriaPageData = {
  slot2: boolean;
  slot3: boolean;
  [key: string]: string | boolean;
};

/** Dados para `{#paginas}` no promissoria.docx (3 promissórias por página). */
export function buildPromissoriasPaginasData(
  cliente: Cliente,
  contrato: Contrato,
  parcelas: Parcela[],
): { paginas: PromissoriaPageData[] } {
  const sorted = [...parcelas].sort((a, b) => a.numero - b.numero);
  const pages = chunkArray(sorted, PROMISSORIAS_PER_PAGE);

  return {
    paginas: pages.map((chunk) => {
      const page: PromissoriaPageData = {
        slot2: chunk.length >= 2,
        slot3: chunk.length >= 3,
      };
      chunk.forEach((parcela, idx) => {
        const prefix = SLOT_PREFIXES[idx]!;
        const vars = buildPromissoriaDocumentVars(cliente, contrato, parcela);
        Object.assign(page, prefixVars(prefix, vars));
      });
      return page;
    }),
  };
}
