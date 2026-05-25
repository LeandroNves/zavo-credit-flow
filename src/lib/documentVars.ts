import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { formatCPF } from "@/lib/brFormat";
import {
  buildProdutosListaText,
  formatProdutoImeiClause,
  getContratoProdutos,
  produtosToDocxLoop,
} from "@/lib/contractProducts";
import {
  dataAssinaturaExtenso,
  dataBRPorExtenso,
  formatMoedaBR,
  formatMoedaNumeroBR,
  mesAnoPagamentoExtenso,
  valorReaisPorExtenso,
} from "@/lib/valorPorExtenso";

function t(v: string | undefined | null): string {
  return String(v ?? "").trim();
}

/** Local de pagamento: cidade/UF extraída do fim do endereço ou endereço completo. */
export function localPagamentoFromEndereco(endereco: string): string {
  const e = t(endereco);
  if (!e) return "";
  const parts = e.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]!;
    if (last.length <= 40) return last;
  }
  return e;
}

export type DocumentTemplateKind = "contrato" | "promissoria";

/** Dados para docxtemplater (placeholders + loop {#produtos}). */
export type ContratoDocxData = Record<string, string | unknown>;

export function buildContratoDocumentVars(
  cliente: Cliente,
  contrato: Contrato,
): Record<string, string> {
  const data = buildContratoDocxData(cliente, contrato);
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string") flat[k] = v;
  }
  return flat;
}

export function buildContratoDocxData(
  cliente: Cliente,
  contrato: Contrato,
): ContratoDocxData {
  const primeira = contrato.listaParcelas[0];
  const valorParcela = primeira?.valor ?? contrato.valorParcela;
  const primeiroVenc = primeira?.vencimento ?? "";
  const produtos = getContratoProdutos(contrato);
  const first = produtos[0]!;

  return {
    nome_cliente: t(cliente.nome),
    profissao: t(cliente.profissao),
    cpf: formatCPF(cliente.cpf),
    rg: t(cliente.rg),
    data_nascimento: t(cliente.dataNascimento),
    endereco: t(cliente.enderecoResidencial),
    telefone: t(cliente.telefone),
    produto_categoria: t(first.produtoCategoria),
    produto_modelo: t(first.produtoModelo),
    produto_cor: t(first.produtoCor),
    produto_serie: t(first.produtoSerie),
    produto_imei: t(first.produtoImei),
    produto_imei2: t(first.produtoImei2),
    produto_imei_clause: formatProdutoImeiClause(first),
    produto_estado: t(first.produtoEstado),
    produto_acessorios: t(first.produtoAcessorios),
    produtos_lista: buildProdutosListaText(produtos),
    produtos_qtd: String(produtos.length),
    produtos: produtosToDocxLoop(produtos),
    valor_total: formatMoedaBR(contrato.valor).replace("R$", "R$").trim(),
    valor_total_extenso: valorReaisPorExtenso(contrato.valor),
    num_parcelas: String(contrato.parcelas),
    valor_parcela: formatMoedaBR(valorParcela),
    valor_parcela_extenso: valorReaisPorExtenso(valorParcela),
    primeiro_vencimento: primeiroVenc,
    numero_contrato: t(contrato.numero).replace(/^#/, ""),
    data_local_assinatura: `[Goiânia GO], ${dataAssinaturaExtenso()}`,
    nome_cliente_assinatura: t(cliente.nome),
  };
}

export function buildPromissoriaDocumentVars(
  cliente: Cliente,
  contrato: Contrato,
  parcela: Parcela,
): Record<string, string> {
  const endereco = t(cliente.enderecoResidencial);
  return {
    parcela_label: `N. #${parcela.numero}/${parcela.total}#`,
    vencimento_extenso: dataBRPorExtenso(parcela.vencimento),
    valor_parcela: formatMoedaBR(parcela.valor),
    valor_parcela_numero: formatMoedaNumeroBR(parcela.valor),
    valor_parcela_extenso: valorReaisPorExtenso(parcela.valor),
    valor_parcela_extenso_upper: valorReaisPorExtenso(parcela.valor).toUpperCase(),
    mes_pagamento_extenso: mesAnoPagamentoExtenso(parcela.vencimento),
    local_pagamento: localPagamentoFromEndereco(endereco),
    nome_cliente: t(cliente.nome),
    cpf: formatCPF(cliente.cpf),
    endereco,
    data_emissao: new Date().toLocaleDateString("pt-BR"),
  };
}
