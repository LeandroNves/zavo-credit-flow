export type GenerateDocumentTemplate = "contrato" | "promissoria";

/** Contrato: aceita loop `{#produtos}`; promissória: só strings. */
export type GenerateDocumentVars = Record<string, string | unknown>;

async function parseErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string; error?: string };
    if (data.message) return data.message;
    if (data.error === "template_missing") {
      return "Modelo Word não encontrado no servidor.";
    }
    if (data.error === "unauthorized") {
      return "Sessão admin expirada. Faça login novamente.";
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function downloadGeneratedDocx(input: {
  template: GenerateDocumentTemplate;
  filename: string;
  vars: GenerateDocumentVars;
}): Promise<void> {
  const res = await fetch("/api/admin/generate-document", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: input.template,
      filename: input.filename,
      vars: input.vars,
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Não foi possível gerar o Word."),
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPromissoriasBatch(input: {
  filename: string;
  paginas: Record<string, string | boolean>[];
}): Promise<void> {
  const res = await fetch("/api/admin/generate-document", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "promissoria",
      filename: input.filename,
      promissoriaPages: input.paginas,
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Não foi possível gerar o Word das promissórias."),
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadGeneratedZip(input: {
  template: GenerateDocumentTemplate;
  zipFilename: string;
  entries: { filename: string; vars: GenerateDocumentVars }[];
}): Promise<void> {
  const res = await fetch("/api/admin/generate-document", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: input.template,
      zip: {
        filename: input.zipFilename,
        entries: input.entries,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(
      await parseErrorMessage(res, "Não foi possível gerar o ZIP de promissórias."),
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.zipFilename;
  a.click();
  URL.revokeObjectURL(url);
}
