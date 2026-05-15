import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { docxBufferToPdf } from "./docxToPdf.js";

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
  const templatesDir = resolveTemplatesDir();
  const fileName = TEMPLATE_FILES[templateId];
  const filePath = path.join(templatesDir, fileName);
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

export async function renderPdfBuffer(
  templateId: DocumentTemplateId,
  vars: Record<string, string>,
): Promise<Buffer> {
  const docx = renderDocxBuffer(templateId, vars);
  return docxBufferToPdf(docx);
}

export function sanitizeDownloadFilename(name: string): string {
  return name.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120) || "documento.pdf";
}
