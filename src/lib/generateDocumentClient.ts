export type GenerateDocumentTemplate = "contrato" | "promissoria";
export type GenerateDocumentFormat = "pdf" | "docx";

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

export async function downloadGeneratedDocument(input: {
  template: GenerateDocumentTemplate;
  format: GenerateDocumentFormat;
  filename: string;
  vars: Record<string, string>;
}): Promise<void> {
  const res = await fetch("/api/admin/generate-document", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: input.template,
      format: input.format,
      filename: input.filename,
      vars: input.vars,
    }),
  });

  if (!res.ok) {
    const fallback =
      input.format === "docx"
        ? "Não foi possível gerar o Word."
        : "Não foi possível gerar o PDF.";
    throw new Error(await parseErrorMessage(res, fallback));
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadGeneratedPdf(input: {
  template: GenerateDocumentTemplate;
  filename: string;
  vars: Record<string, string>;
}): Promise<void> {
  return downloadGeneratedDocument({ ...input, format: "pdf" });
}

export async function downloadGeneratedDocx(input: {
  template: GenerateDocumentTemplate;
  filename: string;
  vars: Record<string, string>;
}): Promise<void> {
  return downloadGeneratedDocument({ ...input, format: "docx" });
}

export async function downloadGeneratedZip(input: {
  template: GenerateDocumentTemplate;
  format?: GenerateDocumentFormat;
  zipFilename: string;
  entries: { filename: string; vars: Record<string, string> }[];
}): Promise<void> {
  const format = input.format ?? "pdf";
  const res = await fetch("/api/admin/generate-document", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: input.template,
      format,
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
