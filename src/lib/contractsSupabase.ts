import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { mockClientes } from "@/data/mockData";
import { deriveClienteStatus } from "@/lib/deriveClienteStatus";
import { formatIsoToBR, parseBRDateToIso } from "@/lib/parcelSchedule";
import { type ContractStatus, isContractStatus } from "@/lib/contractStatus";

type ClientRow = {
  id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  estado_civil: string | null;
  instagram: string | null;
  contato1: string | null;
  contato2: string | null;
  endereco_residencial: string | null;
  endereco_trabalho: string | null;
  salario: string | null;
  dependentes: string | null;
  tipo_moradia: string | null;
  outras_rendas: string | null;
  status_contrato: string | null;
  status_manual?: string | null;
};

type ContractRow = {
  id: string;
  client_id: string;
  numero: string;
  valor_total: number;
  parcelas_count: number;
  valor_parcela: number;
  status: string;
};

type InstallmentRow = {
  contract_id: string;
  numero: number;
  valor: number;
  due_date: string;
  status: string;
  boleto_storage_path: string | null;
};

function clientToRow(c: Cliente): Record<string, unknown> {
  return {
    id: c.id,
    nome: c.nome,
    cpf: c.cpf,
    email: c.email,
    telefone: c.telefone,
    estado_civil: c.estadoCivil,
    instagram: c.instagram,
    contato1: c.contato1,
    contato2: c.contato2,
    endereco_residencial: c.enderecoResidencial,
    endereco_trabalho: c.enderecoTrabalho,
    salario: c.salario,
    dependentes: c.dependentes,
    tipo_moradia: c.tipoMoradia,
    outras_rendas: c.outrasRendas,
    status_contrato: c.statusContrato,
    status_manual: c.situacao,
  };
}

function rowToCliente(row: ClientRow, contratos: Contrato[]): Cliente {
  const rawManual = (row.status_manual ?? "regular").toString().toLowerCase();
  const situacao = rawManual === "irregular" ? "irregular" : "regular";
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf ?? "",
    email: row.email ?? "",
    telefone: row.telefone ?? "",
    estadoCivil: row.estado_civil ?? "",
    instagram: row.instagram ?? "",
    contato1: row.contato1 ?? "",
    contato2: row.contato2 ?? "",
    enderecoResidencial: row.endereco_residencial ?? "",
    enderecoTrabalho: row.endereco_trabalho ?? "",
    salario: row.salario ?? "",
    dependentes: row.dependentes ?? "",
    tipoMoradia: row.tipo_moradia ?? "",
    outrasRendas: row.outras_rendas ?? "",
    situacao,
    statusContrato: deriveClienteStatus(contratos),
    contratos,
  };
}

const ESTADO_CIVIL_LABEL: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
};

const TIPO_MORADIA_LABEL: Record<string, string> = {
  propria: "Própria",
  aluguel: "Aluguel",
  financiada: "Financiada",
  familiar: "Familiar",
};

function emptyToNull(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  return t.length ? t : null;
}

function resolvedEstadoCivilKey(key: string | undefined): string | null {
  const k = (key ?? "").trim();
  if (!k) return null;
  return ESTADO_CIVIL_LABEL[k] ?? k;
}

function resolvedTipoMoradiaKey(key: string | undefined): string | null {
  const k = (key ?? "").trim();
  if (!k) return null;
  return TIPO_MORADIA_LABEL[k] ?? k;
}

/** Campos do formulário admin; apenas `nome` é obrigatório na aplicação. */
export type ManualClienteFields = {
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  estadoCivil?: string;
  instagram?: string;
  contato1?: string;
  contato2?: string;
  enderecoResidencial?: string;
  enderecoTrabalho?: string;
  salario?: string;
  dependentes?: string;
  tipoMoradia?: string;
  outrasRendas?: string;
};

export function buildClienteFromManualFields(
  id: string,
  fields: ManualClienteFields,
): Cliente {
  const ec = resolvedEstadoCivilKey(fields.estadoCivil);
  const tm = resolvedTipoMoradiaKey(fields.tipoMoradia);
  return {
    id,
    nome: fields.nome.trim(),
    cpf: (fields.cpf ?? "").trim(),
    email: (fields.email ?? "").trim().toLowerCase(),
    telefone: (fields.telefone ?? "").trim(),
    estadoCivil: ec ?? "",
    instagram: (fields.instagram ?? "").trim(),
    contato1: (fields.contato1 ?? "").trim(),
    contato2: (fields.contato2 ?? "").trim(),
    enderecoResidencial: (fields.enderecoResidencial ?? "").trim(),
    enderecoTrabalho: (fields.enderecoTrabalho ?? "").trim(),
    salario: (fields.salario ?? "").trim(),
    dependentes: (fields.dependentes ?? "").trim(),
    tipoMoradia: tm ?? "",
    outrasRendas: (fields.outrasRendas ?? "").trim(),
    situacao: "regular",
    statusContrato: "sem_contrato",
    contratos: [],
  };
}

export async function supabaseCreateClientManual(
  sb: SupabaseClient,
  fields: ManualClienteFields,
): Promise<string> {
  const nome = fields.nome.trim();
  if (!nome) throw new Error("Nome é obrigatório.");

  const id = crypto.randomUUID();
  const row = {
    id,
    nome,
    cpf: emptyToNull(fields.cpf),
    email: emptyToNull(fields.email?.toLowerCase()),
    telefone: emptyToNull(fields.telefone),
    estado_civil: resolvedEstadoCivilKey(fields.estadoCivil),
    instagram: emptyToNull(fields.instagram),
    contato1: emptyToNull(fields.contato1),
    contato2: emptyToNull(fields.contato2),
    endereco_residencial: emptyToNull(fields.enderecoResidencial),
    endereco_trabalho: emptyToNull(fields.enderecoTrabalho),
    salario: emptyToNull(fields.salario),
    dependentes: emptyToNull(fields.dependentes),
    tipo_moradia: resolvedTipoMoradiaKey(fields.tipoMoradia),
    outras_rendas: emptyToNull(fields.outrasRendas),
    status_contrato: "sem_contrato",
    status_manual: "regular",
  };

  const { error } = await sb.from("clients").insert(row);
  if (error) throw new Error(error.message);
  return id;
}

export async function supabaseUpdateClientManualStatus(
  sb: SupabaseClient,
  clientId: string,
  status: "regular" | "irregular",
) {
  const { error } = await sb
    .from("clients")
    .update({ status_manual: status })
    .eq("id", clientId);
  if (error) throw error;
}

export async function supabaseUpdateContractStatus(
  sb: SupabaseClient,
  contractId: string,
  status: ContractStatus,
) {
  const { error } = await sb
    .from("contracts")
    .update({ status })
    .eq("id", contractId);
  if (error) throw error;
}

export async function supabaseSendClientPasswordReset(
  sb: SupabaseClient,
  email: string,
) {
  const redirectTo = `${window.location.origin}/login`;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

function profileRowFromManualForAdminPortal(
  userId: string,
  clientId: string,
  fields: ManualClienteFields,
  emailLower: string,
): Record<string, unknown> {
  const t = (s: string | undefined) => (s ?? "").trim();
  const fb = (s: string | undefined, fallback: string) => {
    const x = t(s);
    return x.length ? x : fallback;
  };
  return {
    id: userId,
    nome_completo: fields.nome.trim(),
    cpf: fb(fields.cpf, "—"),
    email: emailLower,
    telefone: fb(fields.telefone, "—"),
    estado_civil: fb(fields.estadoCivil, "nao_informado"),
    instagram: t(fields.instagram),
    contato1: fb(fields.contato1, "—"),
    contato2: fb(fields.contato2, "—"),
    endereco_residencial: fb(fields.enderecoResidencial, "—"),
    endereco_trabalho: fb(fields.enderecoTrabalho, "—"),
    salario: fb(fields.salario, "—"),
    dependentes: fb(fields.dependentes, "—"),
    tipo_moradia: fb(fields.tipoMoradia, "nao_informado"),
    outras_rendas: t(fields.outrasRendas),
    doc_rg_path: null,
    doc_selfie_path: null,
    doc_comprovante_path: null,
    doc_holerite_path: null,
    doc_ctps_path: null,
    doc_extrato_path: null,
    registration_status: "approved",
    linked_client_id: clientId,
  };
}

/**
 * Cria usuário (Auth), cliente e perfil aprovado já vinculado.
 * Encerra a sessão do Supabase no final (evita trocar sessão do admin pelo cliente).
 */
export async function supabaseCreateClienteWithPortalAuth(
  sb: SupabaseClient,
  fields: ManualClienteFields,
  password: string,
): Promise<string> {
  const nome = fields.nome.trim();
  const email = (fields.email ?? "").trim().toLowerCase();
  if (!nome) throw new Error("Nome é obrigatório.");
  if (!email) throw new Error("E-mail é obrigatório para criar o acesso.");

  const { data: signData, error: signError } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nome,
      },
    },
  });

  if (signError) {
    const msg = signError.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("user already registered")
    ) {
      throw new Error("Este e-mail já possui cadastro.");
    }
    throw new Error(signError.message);
  }

  const userId = signData.user?.id;
  if (!userId) {
    await sb.auth.signOut();
    throw new Error("Não foi possível criar o usuário.");
  }

  if (!signData.session) {
    await sb.auth.signOut();
    throw new Error(
      "Confirmação de e-mail está ativa no projeto. Desative em Authentication → Providers → Email ou confirme o e-mail antes de o cliente acessar.",
    );
  }

  const clientId = crypto.randomUUID();
  const clientRow = {
    id: clientId,
    nome,
    cpf: emptyToNull(fields.cpf),
    email: email,
    telefone: emptyToNull(fields.telefone),
    estado_civil: resolvedEstadoCivilKey(fields.estadoCivil),
    instagram: emptyToNull(fields.instagram),
    contato1: emptyToNull(fields.contato1),
    contato2: emptyToNull(fields.contato2),
    endereco_residencial: emptyToNull(fields.enderecoResidencial),
    endereco_trabalho: emptyToNull(fields.enderecoTrabalho),
    salario: emptyToNull(fields.salario),
    dependentes: emptyToNull(fields.dependentes),
    tipo_moradia: resolvedTipoMoradiaKey(fields.tipoMoradia),
    outras_rendas: emptyToNull(fields.outrasRendas),
    status_contrato: "sem_contrato",
  };

  const { error: cErr } = await sb.from("clients").insert(clientRow);
  if (cErr) {
    await sb.auth.signOut();
    throw new Error(cErr.message);
  }

  const profilePayload = profileRowFromManualForAdminPortal(
    userId,
    clientId,
    fields,
    email,
  );
  const { error: pErr } = await sb.from("profiles").insert(profilePayload);
  if (pErr) {
    await sb.auth.signOut();
    throw new Error(pErr.message);
  }

  await sb.auth.signOut();
  return clientId;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function ensureSupabaseSeed(sb: SupabaseClient): Promise<void> {
  const { count, error } = await sb
    .from("clients")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  for (const c of mockClientes) {
    const { error: e1 } = await sb.from("clients").insert(clientToRow(c));
    if (e1) throw e1;
    for (const k of c.contratos) {
      const { error: e2 } = await sb.from("contracts").insert({
        id: k.id,
        client_id: c.id,
        numero: k.numero,
        valor_total: k.valor,
        parcelas_count: k.parcelas,
        valor_parcela: k.valorParcela,
        status: k.status,
      });
      if (e2) throw e2;
      for (const p of k.listaParcelas) {
        const { error: e3 } = await sb.from("installments").insert({
          contract_id: k.id,
          numero: p.numero,
          valor: p.valor,
          due_date: parseBRDateToIso(p.vencimento),
          status: p.status,
          boleto_storage_path: p.boletoPath ?? null,
        });
        if (e3) throw e3;
      }
    }
  }
}

export async function fetchClientesFromSupabase(sb: SupabaseClient): Promise<Cliente[]> {
  const { data: rowsC, error: e1 } = await sb
    .from("clients")
    .select("*")
    .order("nome");
  if (e1) throw e1;

  const { data: rowsK, error: e2 } = await sb.from("contracts").select("*");
  if (e2) throw e2;

  const { data: rowsI, error: e3 } = await sb.from("installments").select("*");
  if (e3) throw e3;

  const clients = (rowsC || []) as ClientRow[];
  const contracts = (rowsK || []) as ContractRow[];
  const installments = (rowsI || []) as InstallmentRow[];

  const contractsByClient = new Map<string, Contrato[]>();

  for (const k of contracts) {
    const inst = installments.filter((i) => i.contract_id === k.id);
    const listaParcelas: Parcela[] = inst
      .sort((a, b) => a.numero - b.numero)
      .map((i) => {
        let boletoUrl: string | null = null;
        if (i.boleto_storage_path) {
          const { data } = sb.storage.from("boletos").getPublicUrl(i.boleto_storage_path);
          boletoUrl = data.publicUrl;
        }
        return {
          numero: i.numero,
          total: k.parcelas_count,
          valor: Number(i.valor),
          vencimento: formatIsoToBR(i.due_date),
          status: i.status as Parcela["status"],
          boletoUrl,
          boletoPath: i.boleto_storage_path,
        };
      });

    const statusRaw = String(k.status ?? "").toLowerCase();
    const status: ContractStatus = isContractStatus(statusRaw) ? statusRaw : "ativo";
    const contrato: Contrato = {
      id: k.id,
      numero: k.numero,
      valor: Number(k.valor_total),
      parcelas: k.parcelas_count,
      valorParcela: Number(k.valor_parcela),
      status,
      listaParcelas,
    };

    const list = contractsByClient.get(k.client_id) || [];
    list.push(contrato);
    contractsByClient.set(k.client_id, list);
  }

  return clients.map((row) =>
    rowToCliente(row, contractsByClient.get(row.id) || []),
  );
}

async function recomputeClientRowStatus(sb: SupabaseClient, clientId: string) {
  const { data: contracts, error } = await sb
    .from("contracts")
    .select("status")
    .eq("client_id", clientId);
  if (error) throw error;
  const list = contracts || [];
  let status: Cliente["statusContrato"] = "sem_contrato";
  if (list.length === 0) status = "sem_contrato";
  else if (list.every((c) => c.status === "finalizado" || c.status === "cancelado")) status = "finalizado";
  else if (list.some((c) => ["ativo", "aprovado", "enviado", "aguardando_aprovacao", "parcelas_pendentes"].includes(c.status))) status = "ativo";
  else status = "em_andamento";

  const { error: u } = await sb
    .from("clients")
    .update({ status_contrato: status })
    .eq("id", clientId);
  if (u) throw u;
}

export async function supabaseCreateContractWithInstallments(
  sb: SupabaseClient,
  clientId: string,
  contrato: Contrato,
  parcelas: Parcela[],
  filesByParcelaNum: Map<number, File>,
): Promise<void> {
  const { error: e1 } = await sb.from("contracts").insert({
    id: contrato.id,
    client_id: clientId,
    numero: contrato.numero,
    valor_total: contrato.valor,
    parcelas_count: contrato.parcelas,
    valor_parcela: contrato.valorParcela,
    status: contrato.status,
  });
  if (e1) throw e1;

  for (const p of parcelas) {
    const { error: e2 } = await sb.from("installments").insert({
      contract_id: contrato.id,
      numero: p.numero,
      valor: p.valor,
      due_date: parseBRDateToIso(p.vencimento),
      status: p.status,
      boleto_storage_path: null,
    });
    if (e2) throw e2;
  }

  for (const [num, file] of filesByParcelaNum) {
    const path = `${clientId}/${contrato.id}/${num}_${sanitizeFileName(file.name)}`;
    const { error: up } = await sb.storage
      .from("boletos")
      .upload(path, file, { upsert: true });
    if (up) throw up;
    const { error: upRow } = await sb
      .from("installments")
      .update({ boleto_storage_path: path })
      .eq("contract_id", contrato.id)
      .eq("numero", num);
    if (upRow) throw upRow;
  }

  await recomputeClientRowStatus(sb, clientId);
}

export async function supabaseUpdateInstallmentStatus(
  sb: SupabaseClient,
  contractId: string,
  parcelaNumero: number,
  status: Parcela["status"],
) {
  const { error } = await sb
    .from("installments")
    .update({ status })
    .eq("contract_id", contractId)
    .eq("numero", parcelaNumero);
  if (error) throw error;
}

export async function supabaseUploadInstallmentBoleto(
  sb: SupabaseClient,
  clientId: string,
  contractId: string,
  parcelaNumero: number,
  file: File,
) {
  const path = `${clientId}/${contractId}/${parcelaNumero}_${sanitizeFileName(file.name)}`;
  const { error: up } = await sb.storage
    .from("boletos")
    .upload(path, file, { upsert: true });
  if (up) throw up;
  const { error } = await sb
    .from("installments")
    .update({ boleto_storage_path: path })
    .eq("contract_id", contractId)
    .eq("numero", parcelaNumero);
  if (error) throw error;
}

export async function supabaseFinalizeContract(
  sb: SupabaseClient,
  clientId: string,
  contractId: string,
) {
  const { error } = await sb
    .from("contracts")
    .update({ status: "finalizado" })
    .eq("id", contractId);
  if (error) throw error;
  await recomputeClientRowStatus(sb, clientId);
}

export async function supabaseUpdateContractNumero(
  sb: SupabaseClient,
  contractId: string,
  numero: string,
) {
  const { error } = await sb
    .from("contracts")
    .update({ numero })
    .eq("id", contractId);
  if (error) throw error;
}

/** Remove boletos no Storage, depois o contrato (parcelas em cascade). */
export async function supabaseDeleteContract(
  sb: SupabaseClient,
  clientId: string,
  contractId: string,
) {
  const { data: rows, error: qErr } = await sb
    .from("installments")
    .select("boleto_storage_path")
    .eq("contract_id", contractId);
  if (qErr) throw qErr;
  const paths = (rows || [])
    .map((r) => r.boleto_storage_path as string | null)
    .filter((p): p is string => Boolean(p));
  if (paths.length > 0) {
    const { error: rmErr } = await sb.storage.from("boletos").remove(paths);
    if (rmErr) {
      console.warn("Storage boletos:", rmErr);
    }
  }
  const { error: dErr } = await sb
    .from("contracts")
    .delete()
    .eq("id", contractId)
    .eq("client_id", clientId);
  if (dErr) throw dErr;
  await recomputeClientRowStatus(sb, clientId);
}

/** Remove cliente e dados vinculados (contratos/parcelas em cascade + boletos do storage). */
export async function supabaseDeleteClient(
  sb: SupabaseClient,
  clientId: string,
) {
  // Remove perfil vinculado ao cliente (cadastro/portal), se existir.
  // Obs.: apagar auth.users exige service role (não disponível no front-end).
  const { error: pErr } = await sb
    .from("profiles")
    .delete()
    .eq("linked_client_id", clientId);
  if (pErr) throw pErr;

  const { data: contracts, error: cErr } = await sb
    .from("contracts")
    .select("id")
    .eq("client_id", clientId);
  if (cErr) throw cErr;

  const contractIds = (contracts || []).map((c) => c.id as string);
  if (contractIds.length > 0) {
    const { data: instRows, error: iErr } = await sb
      .from("installments")
      .select("boleto_storage_path")
      .in("contract_id", contractIds);
    if (iErr) throw iErr;

    const paths = (instRows || [])
      .map((r) => r.boleto_storage_path as string | null)
      .filter((p): p is string => Boolean(p));

    if (paths.length > 0) {
      const { error: rmErr } = await sb.storage.from("boletos").remove(paths);
      if (rmErr) {
        console.warn("Storage boletos:", rmErr);
      }
    }
  }

  const { error: dErr } = await sb.from("clients").delete().eq("id", clientId);
  if (dErr) throw dErr;
}
