/** Converte DOCX → PDF via Gotenberg (LibreOffice), preservando layout, logos e timbrado. */
export async function docxBufferToPdfGotenberg(
  docx: Buffer,
  baseUrl: string,
): Promise<Buffer> {
  const endpoint = `${baseUrl.replace(/\/$/, "")}/forms/libreoffice/convert`;
  const form = new FormData();
  form.append(
    "files",
    new Blob([docx], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "document.docx",
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      throw new Error(
        `gotenberg_error: HTTP ${res.status}${detail ? ` — ${detail}` : ""}`,
      );
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("gotenberg_error: tempo esgotado ao converter o documento");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
