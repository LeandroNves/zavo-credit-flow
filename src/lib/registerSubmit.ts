import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegisterFormState } from "@/pages/Register";

const BUCKET = "registration-docs";

function extFromFile(f: File): string {
  const n = f.name;
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i) : "";
}

async function uploadDoc(
  client: SupabaseClient,
  userId: string,
  key: string,
  file: File | null,
): Promise<string | null> {
  if (!file) return null;
  const path = `${userId}/${key}${extFromFile(file)}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
  return path;
}

export type RegisterSubmitResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Cria usuário no Supabase Auth (senha hasheada no servidor) e grava perfil + documentos.
 * Exige confirmação de e-mail desativada no projeto ou sessão retornada no signUp.
 */
export async function submitRegistration(
  client: SupabaseClient,
  form: RegisterFormState,
): Promise<RegisterSubmitResult> {
  const email = form.email.trim().toLowerCase();

  const { data: signData, error: signError } = await client.auth.signUp({
    email,
    password: form.senha,
    options: {
      data: {
        nome_completo: form.nome.trim(),
      },
    },
  });

  if (signError) {
    if (
      signError.message.includes("already registered") ||
      signError.message.includes("User already registered")
    ) {
      return { ok: false, message: "Este e-mail já possui cadastro. Tente entrar." };
    }
    return { ok: false, message: signError.message };
  }

  const userId = signData.user?.id;
  if (!userId) {
    return {
      ok: false,
      message: "Não foi possível criar o usuário. Tente novamente.",
    };
  }

  if (!signData.session) {
    await client.auth.signOut();
    return {
      ok: false,
      message:
        "O projeto exige confirmação de e-mail. No Supabase: Authentication → Providers → Email → desative “Confirm email” para testes, ou confirme o e-mail antes de concluir o cadastro.",
    };
  }

  try {
    const [rgPath, selfiePath, compPath, holPath, ctpsPath, extratoPath] =
      await Promise.all([
        uploadDoc(client, userId, "rg", form.rg),
        uploadDoc(client, userId, "selfie", form.selfie),
        uploadDoc(client, userId, "comprovante", form.comprovante),
        uploadDoc(client, userId, "holerite", form.holerite),
        uploadDoc(client, userId, "ctps", form.ctps),
        uploadDoc(client, userId, "extrato", form.extrato),
      ]);

    const { error: insErr } = await client.from("profiles").insert({
      id: userId,
      nome_completo: form.nome.trim(),
      cpf: form.cpf.trim(),
      email,
      telefone: form.telefone.trim(),
      estado_civil: form.estadoCivil,
      instagram: form.instagram.trim(),
      contato1: form.contato1.trim(),
      contato2: form.contato2.trim(),
      endereco_residencial: form.enderecoResidencial.trim(),
      endereco_trabalho: form.enderecoTrabalho.trim(),
      salario: form.salario.trim(),
      dependentes: form.dependentes.trim(),
      tipo_moradia: form.tipoMoradia,
      outras_rendas: form.outrasRendas.trim(),
      doc_rg_path: rgPath,
      doc_selfie_path: selfiePath,
      doc_comprovante_path: compPath,
      doc_holerite_path: holPath,
      doc_ctps_path: ctpsPath,
      doc_extrato_path: extratoPath,
      registration_status: "pending",
    });

    if (insErr) {
      console.error(insErr);
      return {
        ok: false,
        message:
          "Conta criada, mas falhou ao salvar o cadastro. Entre em contato com o suporte.",
      };
    }

    return { ok: true };
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      message: "Falha ao enviar documentos. Verifique o tamanho dos arquivos e tente novamente.",
    };
  }
}
