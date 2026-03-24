import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/lib/profileTypes";

const ESTADO_LABEL: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
};

const MORADIA_LABEL: Record<string, string> = {
  propria: "Própria",
  aluguel: "Aluguel",
  financiada: "Financiada",
  familiar: "Familiar",
};

export async function approveProfile(
  sb: SupabaseClient,
  profile: ProfileRow,
): Promise<{ error: Error | null }> {
  const newClientId = crypto.randomUUID();

  const { error: cErr } = await sb.from("clients").insert({
    id: newClientId,
    nome: profile.nome_completo,
    cpf: profile.cpf,
    email: profile.email,
    telefone: profile.telefone,
    estado_civil:
      ESTADO_LABEL[profile.estado_civil] ?? profile.estado_civil,
    instagram: profile.instagram ?? "",
    contato1: profile.contato1,
    contato2: profile.contato2,
    endereco_residencial: profile.endereco_residencial,
    endereco_trabalho: profile.endereco_trabalho,
    salario: profile.salario,
    dependentes: profile.dependentes,
    tipo_moradia:
      MORADIA_LABEL[profile.tipo_moradia] ?? profile.tipo_moradia,
    outras_rendas: profile.outras_rendas ?? "",
    status_contrato: "sem_contrato",
  });

  if (cErr) return { error: new Error(cErr.message) };

  const { error: pErr } = await sb
    .from("profiles")
    .update({
      registration_status: "approved",
      linked_client_id: newClientId,
    })
    .eq("id", profile.id);

  if (pErr) return { error: new Error(pErr.message) };
  return { error: null };
}

export async function rejectProfile(
  sb: SupabaseClient,
  profileId: string,
): Promise<{ error: Error | null }> {
  const { error } = await sb
    .from("profiles")
    .update({ registration_status: "rejected" })
    .eq("id", profileId);
  if (error) return { error: new Error(error.message) };
  return { error: null };
}
