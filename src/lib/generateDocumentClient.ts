export type GenerateDocumentTemplate = "contrato" | "promissoria";

export async function downloadGeneratedPdf(input: {
  template: GenerateDocumentTemplate;
  filename: string;
  vars: Record<string, string>;
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
    let message = "Não foi possível gerar o PDF.";
    try {
      const data = (await res.json()) as { message?: string; error?: string };
      if (data.message) message = data.message;
      else if (data.error === "template_missing") {
        message = "Modelo Word não encontrado no servidor.";
      } else if (data.error === "unauthorized") {
        message = "Sessão admin expirada. Faça login novamente.";
      }
    } catch {
      /* ignore */
    }
    throw new Error(message);
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
  entries: { filename: string; vars: Record<string, string> }[];
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
    let message = "Não foi possível gerar o ZIP de promissórias.";
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.zipFilename;
  a.click();
  URL.revokeObjectURL(url);
}
