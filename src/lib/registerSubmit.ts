import type { SupabaseClient } from "@supabase/supabase-js";
import type { RegisterFormState } from "@/pages/Register";
import { storeDocPathsForProfile } from "@/lib/registrationDocs";

const BUCKET = "registration-docs";

function extFromFile(f: File): string {
  const n = f.name;
  const i = n.lastIndexOf(".");
  return i >= 0 ? n.slice(i) : "";
}

async function uploadDocGroup(
  client: SupabaseClient,
  userId: string,
  keyPrefix: string,
  files: File[],
): Promise<string[]> {
  const out: string[] = [];
  let seq = 0;
  for (const file of files) {
    const path = `${userId}/${keyPrefix}_${seq++}_${crypto.randomUUID().slice(0, 8)}${extFromFile(file)}`;
    const { error } = await client.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (error) throw error;
    out.push(path);
  }
  return out;
}

export type RegisterSubmitResult =
  | { ok: true; warning?: string }
  | { ok: false; message: string };

function isAlreadyRegisteredError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("already registered") || m.includes("user already registered");
}

function buildProfileRow(userId: string, form: RegisterFormState, email: string) {
  return {
    id: userId,
    nome_completo: form.nome.trim(),
    cpf: form.cpf.trim(),
    email,
    telefone: form.telefone.trim(),
    estado_civil: form.estadoCivil,
    instagram: "",
    contato1: form.contato1.trim(),
    contato2: form.contato2.trim(),
    endereco_residencial: form.enderecoResidencial.trim(),
    endereco_trabalho: form.enderecoTrabalho.trim(),
    salario: form.salario.trim(),
    dependentes: "",
    tipo_moradia: "",
    outras_rendas: "",
    interest_type: "produto" as const,
    interest_cart: form.interesseCarrinho,
    registration_status: "pending" as const,
  };
}

async function profileExists(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

/** Grava o perfil antes dos documentos para o login não ficar sem linha em `profiles`. */
async function ensureProfileRow(
  client: SupabaseClient,
  userId: string,
  form: RegisterFormState,
  email: string,
): Promise<void> {
  const row = buildProfileRow(userId, form, email);
  const { error: insErr } = await client.from("profiles").insert({
    ...row,
    doc_rg_path: null,
    doc_selfie_path: null,
    doc_comprovante_path: null,
    doc_holerite_path: null,
    doc_ctps_path: null,
    doc_extrato_path: null,
  });
  if (!insErr) return;

  const duplicate =
    insErr.code === "23505" ||
    insErr.message.toLowerCase().includes("duplicate") ||
    insErr.message.toLowerCase().includes("unique");
  if (!duplicate) throw insErr;

  const { error: updErr } = await client
    .from("profiles")
    .update(row)
    .eq("id", userId);
  if (updErr) throw updErr;
}

async function attachRegistrationDocuments(
  client: SupabaseClient,
  userId: string,
  form: RegisterFormState,
): Promise<void> {
  const [rgPaths, selfiePaths, compPaths, holPaths, ctpsPaths, extratoPaths] =
    await Promise.all([
      uploadDocGroup(client, userId, "rg", form.rg),
      uploadDocGroup(client, userId, "selfie", form.selfie),
      uploadDocGroup(client, userId, "comprovante", form.comprovante),
      uploadDocGroup(client, userId, "holerite", form.holerite),
      uploadDocGroup(client, userId, "ctps", form.ctps),
      uploadDocGroup(client, userId, "extrato", form.extrato),
    ]);

  const { error: updErr } = await client
    .from("profiles")
    .update({
      doc_rg_path: storeDocPathsForProfile(rgPaths),
      doc_selfie_path: storeDocPathsForProfile(selfiePaths),
      doc_comprovante_path: storeDocPathsForProfile(compPaths),
      doc_holerite_path: storeDocPathsForProfile(holPaths),
      doc_ctps_path: storeDocPathsForProfile(ctpsPaths),
      doc_extrato_path: storeDocPathsForProfile(extratoPaths),
    })
    .eq("id", userId);
  if (updErr) throw updErr;
}

async function finalizeRegistrationForUser(
  client: SupabaseClient,
  userId: string,
  form: RegisterFormState,
  email: string,
): Promise<RegisterSubmitResult> {
  try {
    await ensureProfileRow(client, userId, form, email);
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      message:
        "Conta criada, mas falhou ao salvar o cadastro. Entre em contato com o suporte para concluir o registro.",
    };
  }

  try {
    await attachRegistrationDocuments(client, userId, form);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return {
      ok: true,
      warning:
        "Cadastro recebido, mas alguns documentos não foram enviados. Nossa equipe pode solicitar o reenvio.",
    };
  }
}

/**
 * Cria usuário no Supabase Auth (senha hasheada no servidor) e grava perfil + documentos.
 * Exige confirmação de e-mail desativada no projeto ou sessão retornada no signUp.
 */
export async function submitRegistration(
  client: SupabaseClient,
  form: RegisterFormState,
): Promise<RegisterSubmitResult> {
  const email = form.email.trim().toLowerCase();
  const password = form.senha;

  const { data: signData, error: signError } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: form.nome.trim(),
      },
    },
  });

  if (signError) {
    if (isAlreadyRegisteredError(signError.message)) {
      const { data: loginData, error: loginErr } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) {
        return { ok: false, message: "Este e-mail já possui cadastro. Tente entrar." };
      }
      const userId = loginData.user?.id;
      if (!userId) {
        return { ok: false, message: "Este e-mail já possui cadastro. Tente entrar." };
      }
      if (await profileExists(client, userId)) {
        return { ok: false, message: "Este e-mail já possui cadastro. Tente entrar." };
      }
      return finalizeRegistrationForUser(client, userId, form, email);
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
        "Confirme o e-mail enviado e tente entrar. Se o problema persistir, contate o suporte — a conta pode ter sido criada sem concluir o cadastro.",
    };
  }

  return finalizeRegistrationForUser(client, userId, form, email);
}
