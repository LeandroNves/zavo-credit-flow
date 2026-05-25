import {
  emptyContractProductFields,
  type ContractProductFields,
  type Contrato,
} from "@/data/mockData";

function t(v: string | undefined | null): string {
  return String(v ?? "").trim();
}

function isProductRow(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function normalizeContractProduct(
  raw: Partial<ContractProductFields> | Record<string, unknown>,
): ContractProductFields {
  const r = raw as Record<string, unknown>;
  return {
    produtoCategoria: t(
      (raw as ContractProductFields).produtoCategoria ??
        (r.produtoCategoria as string) ??
        (r.produto_categoria as string),
    ),
    produtoModelo: t(
      (raw as ContractProductFields).produtoModelo ??
        (r.produtoModelo as string) ??
        (r.produto_modelo as string),
    ),
    produtoCor: t(
      (raw as ContractProductFields).produtoCor ??
        (r.produtoCor as string) ??
        (r.produto_cor as string),
    ),
    produtoSerie: t(
      (raw as ContractProductFields).produtoSerie ??
        (r.produtoSerie as string) ??
        (r.produto_serie as string),
    ),
    produtoImei: t(
      (raw as ContractProductFields).produtoImei ??
        (r.produtoImei as string) ??
        (r.produto_imei as string),
    ),
    produtoImei2: t(
      (raw as ContractProductFields).produtoImei2 ??
        (r.produtoImei2 as string) ??
        (r.produto_imei2 as string),
    ),
    produtoEstado: t(
      (raw as ContractProductFields).produtoEstado ??
        (r.produtoEstado as string) ??
        (r.produto_estado as string),
    ),
    produtoAcessorios: t(
      (raw as ContractProductFields).produtoAcessorios ??
        (r.produtoAcessorios as string) ??
        (r.produto_acessorios as string),
    ),
  };
}

export function productHasAnyField(p: ContractProductFields): boolean {
  return Object.values(p).some((v) => t(v).length > 0);
}

/** Remove itens totalmente vazios; garante ao menos um slot. */
export function normalizeContractProductsList(
  list: ContractProductFields[],
): ContractProductFields[] {
  const trimmed = list.map((p) => normalizeContractProduct(p));
  const nonEmpty = trimmed.filter(productHasAnyField);
  if (nonEmpty.length > 0) return nonEmpty;
  return [emptyContractProductFields()];
}

export function parseProdutosFromContractRow(row: {
  produtos?: unknown;
  produto_categoria?: string | null;
  produto_modelo?: string | null;
  produto_cor?: string | null;
  produto_serie?: string | null;
  produto_imei?: string | null;
  produto_estado?: string | null;
  produto_acessorios?: string | null;
}): ContractProductFields[] {
  const raw = row.produtos;
  if (Array.isArray(raw) && raw.length > 0) {
    const parsed = raw
      .filter(isProductRow)
      .map((item) => normalizeContractProduct(item));
    if (parsed.length > 0) return normalizeContractProductsList(parsed);
  }
  const legacy = normalizeContractProduct({
    produtoCategoria: row.produto_categoria ?? "",
    produtoModelo: row.produto_modelo ?? "",
    produtoCor: row.produto_cor ?? "",
    produtoSerie: row.produto_serie ?? "",
    produtoImei: row.produto_imei ?? "",
    produtoEstado: row.produto_estado ?? "",
    produtoAcessorios: row.produto_acessorios ?? "",
  });
  if (productHasAnyField(legacy)) return [legacy];
  return [emptyContractProductFields()];
}

export function getContratoProdutos(contrato: Contrato): ContractProductFields[] {
  if (contrato.produtos?.length) {
    return normalizeContractProductsList(contrato.produtos);
  }
  return [emptyContractProductFields()];
}

/** Trecho de IMEI(s) no contrato; vazio se nenhum preenchido. */
export function formatProdutoImeiClause(p: ContractProductFields): string {
  const i1 = t(p.produtoImei);
  const i2 = t(p.produtoImei2);
  if (i1 && i2) return `IMEI: ${i1}; IMEI 2: ${i2} `;
  if (i1) return `IMEI: ${i1} `;
  if (i2) return `IMEI: ${i2} `;
  return "";
}

/** Uma linha contínua por produto (layout do contrato original). */
export function formatProdutoContratoLine(
  p: ContractProductFields,
  numero: number,
): string {
  return (
    `Produto ${numero}: ${t(p.produtoCategoria)} ` +
    `Marca/Modelo: ${t(p.produtoModelo)}; ` +
    `Cor: ${t(p.produtoCor)}; ` +
    `Número de Série: ${t(p.produtoSerie)}; ` +
    formatProdutoImeiClause(p) +
    `Estado do Bem (novo/usado): ${t(p.produtoEstado)}; ` +
    `Acessórios Inclusos: ${t(p.produtoAcessorios)}`
  );
}

/** Com marcador • (evita lista automática do Word e o recuo na quebra de linha). */
export function formatProdutoContratoBulletLine(
  p: ContractProductFields,
  numero: number,
): string {
  return `• ${formatProdutoContratoLine(p, numero)}`;
}

/**
 * Texto de todos os produtos para o Word — prefira `{produtos_lista}` (um parágrafo, sem loop).
 * Quebras `\n` viram nova linha alinhada à margem (sem recuo de marcador).
 */
export function buildProdutosListaText(produtos: ContractProductFields[]): string {
  return produtos
    .map((p, i) => formatProdutoContratoBulletLine(p, i + 1))
    .join("\n");
}

export function produtosToDocxLoop(produtos: ContractProductFields[]) {
  return produtos.map((p, i) => ({
    numero: String(i + 1),
    categoria: t(p.produtoCategoria),
    modelo: t(p.produtoModelo),
    cor: t(p.produtoCor),
    serie: t(p.produtoSerie),
    imei: t(p.produtoImei),
    imei2: t(p.produtoImei2),
    imei_clause: formatProdutoImeiClause(p),
    estado: t(p.produtoEstado),
    acessorios: t(p.produtoAcessorios),
    linha: formatProdutoContratoBulletLine(p, i + 1),
  }));
}

export function productFieldsToLegacyRow(
  produtos: ContractProductFields[],
): Record<string, unknown> {
  const first = normalizeContractProductsList(produtos)[0]!;
  return {
    produtos: normalizeContractProductsList(produtos),
    produto_categoria: first.produtoCategoria || null,
    produto_modelo: first.produtoModelo || null,
    produto_cor: first.produtoCor || null,
    produto_serie: first.produtoSerie || null,
    produto_imei: first.produtoImei || null,
    produto_estado: first.produtoEstado || null,
    produto_acessorios: first.produtoAcessorios || null,
  };
}
