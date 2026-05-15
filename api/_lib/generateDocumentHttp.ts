import type { IncomingMessage, ServerResponse } from "node:http";
import { getSessionSecret } from "./adminEnv.js";
import { parseSessionCookie } from "./sessionCookie.js";
import {
  buildZipFromPdfEntries,
  renderPdfBuffer,
  sanitizeDownloadFilename,
  type DocumentTemplateId,
} from "./generateDocument.js";

type GenerateBody = {
  template: DocumentTemplateId;
  filename?: string;
  vars?: Record<string, string>;
  zip?: {
    filename: string;
    entries: { filename: string; vars: Record<string, string> }[];
  };
};

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

function isVarsRecord(v: unknown): v is Record<string, string> {
  if (!v || typeof v !== "object") return false;
  return Object.values(v).every((x) => typeof x === "string" || x == null);
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
      const pdfs: { filename: string; pdf: Buffer }[] = [];
      for (const entry of entries) {
        if (!entry?.vars || !isVarsRecord(entry.vars)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: "invalid_vars" }));
          return;
        }
        const pdf = await renderPdfBuffer(template, entry.vars);
        pdfs.push({
          filename: sanitizeDownloadFilename(entry.filename || "documento.pdf"),
          pdf,
        });
      }
      const zipBuf = await buildZipFromPdfEntries(pdfs);
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
    if (!isVarsRecord(body.vars)) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_vars" }));
      return;
    }

    const pdf = await renderPdfBuffer(template, body.vars);
    const filename = sanitizeDownloadFilename(
      body.filename || `${template}.pdf`,
    );
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.end(pdf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generate_failed";
    console.error("[generate-document]", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: msg.includes("template_missing") ? "template_missing" : "generate_failed",
        message: msg,
      }),
    );
  }
}
