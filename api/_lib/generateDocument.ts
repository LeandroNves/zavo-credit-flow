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

export type DocumentTemplateId = "contrato" | "promissoria";

const TEMPLATE_FILES: Record<DocumentTemplateId, string> = {
  contrato: "contrato.docx",
  promissoria: "promissoria.docx",
};

function resolveTemplatesDir(): string {
  const candidates = [
    path.join(__dirname, "templates"),
    path.join(process.cwd(), "api", "_lib", "templates"),
    path.join(process.cwd(), ".vercel", "output", "api", "_lib", "templates"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "contrato.docx"))) return dir;
  }
  return candidates[0]!;
}

const TEMPLATES_DIR = resolveTemplatesDir();

function trimVars(vars: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    out[k] = String(v ?? "").trim();
  }
  return out;
}

function formatDocxError(err: unknown): string {
  if (err && typeof err === "object" && "properties" in err) {
    const props = (err as { properties?: { errors?: Array<{ message?: string }> } })
      .properties;
    const parts = props?.errors?.map((e) => e.message).filter(Boolean);
    if (parts?.length) return `docx_template_error: ${parts.join("; ")}`;
  }
  if (err instanceof Error) return err.message;
  return "docx_render_failed";
}

export function renderDocxBuffer(
  templateId: DocumentTemplateId,
  vars: Record<string, string>,
): Buffer {
  const fileName = TEMPLATE_FILES[templateId];
  const filePath = path.join(TEMPLATES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `template_missing:${templateId} (procurado em ${filePath}, cwd=${process.cwd()})`,
    );
  }
  const content = fs.readFileSync(filePath);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{", end: "}" },
    nullGetter: () => "",
  });
  try {
    doc.render(trimVars(vars));
  } catch (err) {
    throw new Error(formatDocxError(err));
  }
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

async function launchBrowser() {
  chromium.setGraphicsMode(false);
  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
}

/** DOCX preenchido → PDF (Chromium embutido; funciona na Vercel). */
export async function docxBufferToPdf(docx: Buffer): Promise<Buffer> {
  const { value: html } = await mammoth.convertToHtml({ buffer: docx });
  const fullHtml = wrapHtmlForPdf(html);

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      timeout: 45_000,
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
