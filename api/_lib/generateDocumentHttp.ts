import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionSecret } from "./adminEnv.js";
import { parseSessionCookie } from "./sessionCookie.js";
import {
  renderDocxBuffer,
  renderPdfBuffer,
  sanitizeDownloadFilename,
  type DocumentTemplateId,
} from "./generateDocument.js";
import {
  renderPromissoriasDocxMerged,
  renderPromissoriasPdfMerged,
  type PromissoriaPageVars,
} from "./promissoriaRender.js";

type OutputFormat = "pdf" | "docx";

type GenerateBody = {
  template: DocumentTemplateId;
  format?: OutputFormat;
  filename?: string;
  vars?: Record<string, string>;
  zip?: {
    filename: string;
    entries: { filename: string; vars: Record<string, string> }[];
  };
  /** Promissórias: uma página do modelo (3 slots) por item; mescladas no servidor. */
  promissoriaPages?: PromissoriaPageVars[];
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function readJsonBody(
  req: IncomingMessage & { body?: unknown },
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isTemplateId(v: unknown): v is DocumentTemplateId {
  return v === "contrato" || v === "promissoria";
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isVarsRecord(v: unknown): v is Record<string, unknown> {
  return isPlainObject(v);
}

function parseFormat(v: unknown): OutputFormat {
  return v === "docx" ? "docx" : "pdf";
}

function filenameForFormat(base: string, format: OutputFormat): string {
  const safe = sanitizeDownloadFilename(base);
  if (format === "docx") {
    return safe.replace(/\.pdf$/i, ".docx").replace(/\.zip$/i, ".docx") || "documento.docx";
  }
  return safe.replace(/\.docx$/i, ".pdf") || "documento.pdf";
}

export async function handleGenerateDocument(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const secret = getSessionSecret(env);
  if (!secret) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "admin_not_configured" }));
    return;
  }

  const { ok } = parseSessionCookie(secret, req.headers.cookie);
  if (!ok) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
    return;
  }

  const body = (await readJsonBody(req)) as GenerateBody;
  const format = parseFormat(body.format);

  try {
    if (body.zip && typeof body.zip === "object") {
      const template = body.template;
      if (!isTemplateId(template)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: "invalid_template" }));
        return;
      }
      const entries = body.zip.entries;
      if (!Array.isArray(entries) || entries.length === 0) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: "empty_zip" }));
        return;
      }

      const files: { filename: string; data: Buffer }[] = [];
      for (const entry of entries) {
        if (!entry?.vars || !isVarsRecord(entry.vars)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: "invalid_vars" }));
          return;
        }
        const name = filenameForFormat(
          entry.filename || (format === "docx" ? "documento.docx" : "documento.pdf"),
          format,
        );
        if (format === "docx") {
          files.push({
            filename: name,
            data: renderDocxBuffer(template, entry.vars),
          });
        } else {
          const pdf = await renderPdfBuffer(template, entry.vars);
          files.push({ filename: name, data: pdf });
        }
      }

      const { buildZipFromEntries } = await import("./generateDocumentZip.js");
      const zipBuf = await buildZipFromEntries(files);
      const zipName = sanitizeDownloadFilename(
        body.zip.filename || "promissorias.zip",
      ).replace(/\.pdf$/i, ".zip");
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${zipName}"`,
      );
      res.end(zipBuf);
      return;
    }

    const template = body.template;
    if (!isTemplateId(template)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_template" }));
      return;
    }

    if (
      template === "promissoria" &&
      Array.isArray(body.promissoriaPages) &&
      body.promissoriaPages.length > 0
    ) {
      const pages = body.promissoriaPages.filter((p) => isPlainObject(p));
      const filename = filenameForFormat(
        body.filename || (format === "docx" ? "promissorias.docx" : "promissorias.pdf"),
        format,
      );
      if (format === "docx") {
        const docx = await renderPromissoriasDocxMerged(pages);
        res.statusCode = 200;
        res.setHeader("Content-Type", DOCX_MIME);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.end(docx);
        return;
      }
      const pdf = await renderPromissoriasPdfMerged(pages);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.end(pdf);
      return;
    }

    if (!isVarsRecord(body.vars)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_vars" }));
      return;
    }

    const filename = filenameForFormat(
      body.filename || (format === "docx" ? `${template}.docx` : `${template}.pdf`),
      format,
    );

    if (format === "docx") {
      const docx = renderDocxBuffer(template, body.vars);
      res.statusCode = 200;
      res.setHeader("Content-Type", DOCX_MIME);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.end(docx);
      return;
    }

    const pdf = await renderPdfBuffer(template, body.vars);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(pdf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    console.error("[generate-document]", e);
    let errorCode = "generate_failed";
    if (msg.includes("template_missing")) errorCode = "template_missing";
    else if (msg.includes("docx_template_error")) errorCode = "docx_template_error";
    else if (msg.includes("gotenberg_error")) errorCode = "gotenberg_error";

    let friendly = "Falha ao gerar documento. Tente novamente.";
    if (errorCode === "template_missing") {
      friendly =
        "Modelo Word não encontrado no servidor. Confirme api/_lib/templates/ no deploy.";
    } else if (errorCode === "docx_template_error") {
      friendly = `Erro no modelo Word: ${msg.replace(/^docx_template_error:\s*/, "")}`;
    } else if (msg.includes("gotenberg_error")) {
      friendly = `Erro ao converter para PDF: ${msg.replace(/^gotenberg_error:\s*/, "")}`;
    } else if (msg.includes("mammoth_error")) {
      friendly = `Erro ao ler o documento Word: ${msg.replace(/^mammoth_error:\s*/, "")}`;
    } else if (msg.includes("pdf_render_error")) {
      friendly = `Erro ao montar PDF: ${msg.replace(/^pdf_render_error:\s*/, "")}`;
    } else if (msg.length < 280) {
      friendly = msg;
    }

    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: errorCode,
        message: friendly,
      }),
    );
  }
}
