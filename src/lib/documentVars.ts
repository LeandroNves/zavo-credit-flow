import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { formatCPF } from "@/lib/brFormat";
import {
  dataAssinaturaExtenso,
  dataBRPorExtenso,
  formatMoedaBR,
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

export function buildContratoDocumentVars(
  cliente: Cliente,
  contrato: Contrato,
): Record<string, string> {
  const primeira = contrato.listaParcelas[0];
  const valorParcela = primeira?.valor ?? contrato.valorParcela;
  const primeiroVenc = primeira?.vencimento ?? "";

  return {
    nome_cliente: t(cliente.nome),
    profissao: t(cliente.profissao),
    cpf: formatCPF(cliente.cpf),
    rg: t(cliente.rg),
    data_nascimento: t(cliente.dataNascimento),
    endereco: t(cliente.enderecoResidencial),
    telefone: t(cliente.telefone),
    produto_categoria: t(contrato.produtoCategoria),
    produto_modelo: t(contrato.produtoModelo),
    produto_cor: t(contrato.produtoCor),
    produto_serie: t(contrato.produtoSerie),
    produto_imei: t(contrato.produtoImei),
    produto_estado: t(contrato.produtoEstado),
    produto_acessorios: t(contrato.produtoAcessorios),
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
