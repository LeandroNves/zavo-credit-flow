import mammoth from "mammoth";
import PDFDocument from "pdfkit";
import { docxBufferToPdfGotenberg } from "./gotenberg.js";

function getGotenbergUrl(): string | undefined {
  return process.env.GOTENBERG_URL?.trim() || undefined;
}

/** Converte HTML do mammoth em texto (fallback sem Gotenberg). */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** PDF simplificado (só texto) quando não há Gotenberg. */
async function docxBufferToPdfKit(docx: Buffer): Promise<Buffer> {
  let html = "";
  try {
    const result = await mammoth.convertToHtml({ buffer: docx });
    html = result.value;
  } catch (err) {
    throw new Error(
      `mammoth_error: ${err instanceof Error ? err.message : "falha ao ler docx"}`,
    );
  }

  const text = htmlToPlainText(html);
  if (!text) {
    throw new Error("pdf_render_error: documento vazio após conversão");
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) =>
      reject(
        new Error(
          `pdf_render_error: ${err instanceof Error ? err.message : "falha ao gerar pdf"}`,
        ),
      ),
    );

    doc.font("Times-Roman").fontSize(11).text(text, {
      align: "left",
      lineGap: 4,
      paragraphGap: 8,
    });
    doc.end();
  });
}

/**
 * DOCX → PDF.
 * Com GOTENBERG_URL: layout fiel (LibreOffice).
 * Sem Gotenberg: PDF só com texto (fallback).
 */
export async function docxBufferToPdf(docx: Buffer): Promise<Buffer> {
  const gotenbergUrl = getGotenbergUrl();
  if (gotenbergUrl) {
    return docxBufferToPdfGotenberg(docx, gotenbergUrl);
  }
  return docxBufferToPdfKit(docx);
}

export function isPdfFormattingEnabled(): boolean {
  return Boolean(getGotenbergUrl());
}
