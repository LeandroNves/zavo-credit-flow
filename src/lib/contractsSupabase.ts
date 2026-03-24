import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cliente, Contrato, Parcela } from "@/data/mockData";
import { mockClientes } from "@/data/mockData";
import { deriveClienteStatus } from "@/lib/deriveClienteStatus";
import { formatIsoToBR, parseBRDateToIso } from "@/lib/parcelSchedule";

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
  };
}

function rowToCliente(row: ClientRow, contratos: Contrato[]): Cliente {
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
    statusContrato: deriveClienteStatus(contratos),
    contratos,
  };
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

    const contrato: Contrato = {
      id: k.id,
      numero: k.numero,
      valor: Number(k.valor_total),
      parcelas: k.parcelas_count,
      valorParcela: Number(k.valor_parcela),
      status: k.status as Contrato["status"],
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
  else if (list.every((c) => c.status === "finalizado")) status = "finalizado";
  else if (list.some((c) => c.status === "ativo")) status = "ativo";
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
