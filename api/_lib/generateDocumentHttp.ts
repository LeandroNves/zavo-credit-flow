import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionSecret } from "./adminEnv.js";
import { parseSessionCookie } from "./sessionCookie.js";
import {
  renderDocxBuffer,
  sanitizeDownloadFilename,
  type DocumentTemplateId,
} from "./generateDocument.js";
import {
  renderPromissoriasDocxMerged,
  type PromissoriaPageVars,
} from "./promissoriaRender.js";

type GenerateBody = {
  template: DocumentTemplateId;
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

function ensureDocxFilename(base: string): string {
  const safe = sanitizeDownloadFilename(base);
  return safe.replace(/\.pdf$/i, ".docx").replace(/\.zip$/i, ".docx") || "documento.docx";
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
        files.push({
          filename: ensureDocxFilename(entry.filename || "documento.docx"),
          data: renderDocxBuffer(template, entry.vars),
        });
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
      const filename = ensureDocxFilename(
        body.filename || "promissorias.docx",
      );
      const docx = await renderPromissoriasDocxMerged(pages);
      res.statusCode = 200;
      res.setHeader("Content-Type", DOCX_MIME);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.end(docx);
      return;
    }

    if (!isVarsRecord(body.vars)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_vars" }));
      return;
    }

    const filename = ensureDocxFilename(
      body.filename || `${template}.docx`,
    );
    const docx = renderDocxBuffer(template, body.vars);
    res.statusCode = 200;
    res.setHeader("Content-Type", DOCX_MIME);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(docx);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    console.error("[generate-document]", e);
    let errorCode = "generate_failed";
    if (msg.includes("template_missing")) errorCode = "template_missing";
    else if (msg.includes("docx_template_error")) errorCode = "docx_template_error";

    let friendly = "Falha ao gerar documento. Tente novamente.";
    if (errorCode === "template_missing") {
      friendly =
        "Modelo Word não encontrado no servidor. Confirme api/_lib/templates/ no deploy.";
    } else if (errorCode === "docx_template_error") {
      friendly = `Erro no modelo Word: ${msg.replace(/^docx_template_error:\s*/, "")}`;
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
