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
    const [rgPaths, selfiePaths, compPaths, holPaths, ctpsPaths, extratoPaths] =
      await Promise.all([
        uploadDocGroup(client, userId, "rg", form.rg),
        uploadDocGroup(client, userId, "selfie", form.selfie),
        uploadDocGroup(client, userId, "comprovante", form.comprovante),
        uploadDocGroup(client, userId, "holerite", form.holerite),
        uploadDocGroup(client, userId, "ctps", form.ctps),
        uploadDocGroup(client, userId, "extrato", form.extrato),
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
      interest_type: form.interesseTipo || "emprestimo",
      interest_cart: form.interesseCarrinho,
      doc_rg_path: storeDocPathsForProfile(rgPaths),
      doc_selfie_path: storeDocPathsForProfile(selfiePaths),
      doc_comprovante_path: storeDocPathsForProfile(compPaths),
      doc_holerite_path: storeDocPathsForProfile(holPaths),
      doc_ctps_path: storeDocPathsForProfile(ctpsPaths),
      doc_extrato_path: storeDocPathsForProfile(extratoPaths),
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
