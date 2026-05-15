import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import archiver from "archiver";
import mammoth from "mammoth";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, "templates");

export type DocumentTemplateId = "contrato" | "promissoria";

const TEMPLATE_FILES: Record<DocumentTemplateId, string> = {
  contrato: "contrato.docx",
  promissoria: "promissoria.docx",
};

function trimVars(vars: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    out[k] = String(v ?? "").trim();
  }
  return out;
}

export function renderDocxBuffer(
  templateId: DocumentTemplateId,
  vars: Record<string, string>,
): Buffer {
  const filePath = path.join(TEMPLATES_DIR, TEMPLATE_FILES[templateId]);
  if (!fs.existsSync(filePath)) {
    throw new Error(`template_missing:${templateId}`);
  }
  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
  });
  doc.render(trimVars(vars));
  return doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}

function wrapHtmlForPdf(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000;
    }
    p { margin: 0.35em 0; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ccc; padding: 4px 6px; vertical-align: top; }
    strong, b { font-weight: bold; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

/** DOCX preenchido → PDF (sem LibreOffice/Gotenberg; roda na Vercel). */
export async function docxBufferToPdf(docx: Buffer): Promise<Buffer> {
  const { value: html } = await mammoth.convertToHtml({ buffer: docx });
  const fullHtml = wrapHtmlForPdf(html);

  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 794, height: 1123 },
    executablePath,
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function renderPdfBuffer(
  templateId: DocumentTemplateId,
  vars: Record<string, string>,
): Promise<Buffer> {
  const docx = renderDocxBuffer(templateId, vars);
  return docxBufferToPdf(docx);
}

export async function buildZipFromPdfEntries(
  entries: { filename: string; pdf: Buffer }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));

    for (const e of entries) {
      archive.append(e.pdf, { name: e.filename });
    }
    void archive.finalize();
  });
}

export function sanitizeDownloadFilename(name: string): string {
  return name.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120) || "documento.pdf";
}
