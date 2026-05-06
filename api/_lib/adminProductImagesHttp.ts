import type { IncomingMessage, ServerResponse } from "node:http";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminPassword,
  getAdminUsername,
  getSessionSecret,
  getSupabaseServiceRole,
  getSupabaseUrl,
} from "./adminEnv.js";
import { parseSessionCookie } from "./sessionCookie.js";
import { getSupabaseJwtRole } from "./jwtRole.js";

const BUCKET = "landing-products";

async function readJsonBody(
  req: IncomingMessage & { body?: unknown },
): Promise<Record<string, unknown>> {
  if (req.body != null && typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
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

function assertAdminSession(env: NodeJS.ProcessEnv, req: IncomingMessage): { ok: true } | { ok: false; status: number; error: string; message?: string } {
  const secret = getSessionSecret(env);
  const user = getAdminUsername(env);
  const pass = getAdminPassword(env);
  if (!secret || !user || !pass) {
    return { ok: false, status: 503, error: "admin_not_configured" };
  }
  if (!parseSessionCookie(secret, req.headers.cookie).ok) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  const url = getSupabaseUrl(env);
  const serviceKey = getSupabaseServiceRole(env);
  if (!url || !serviceKey) {
    return { ok: false, status: 503, error: "supabase_not_configured" };
  }
  const keyRole = getSupabaseJwtRole(serviceKey);
  if (keyRole !== "service_role") {
    return {
      ok: false,
      status: 503,
      error: "invalid_service_role_key",
      message:
        keyRole === "anon"
          ? "SUPABASE_SERVICE_ROLE_KEY está com a chave anon/publicável. Use a chave secreta service_role."
          : keyRole
            ? `SUPABASE_SERVICE_ROLE_KEY não é service_role (role=${keyRole}). Use apenas a chave secreta service_role do Supabase.`
            : "SUPABASE_SERVICE_ROLE_KEY não parece ser uma JWT válida. Confira se você colou a chave service_role correta no ambiente (sem aspas e sem espaços).",
    };
  }
  return { ok: true };
}

function decodeDataUrl(dataUrl: string): { bytes: Buffer; contentType: string; ext: string } | null {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const contentType = m[1].trim().toLowerCase();
  const b64 = m[2].trim();
  let bytes: Buffer;
  try {
    bytes = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  const ext =
    contentType.includes("png") ? "png" :
    contentType.includes("webp") ? "webp" :
    contentType.includes("gif") ? "gif" :
    contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" :
    "png";
  return { bytes, contentType, ext };
}

async function ensureBucket(sb: ReturnType<typeof createClient>): Promise<void> {
  // Cria o bucket se não existir (idempotente no fluxo: ignora erro de "already exists")
  const { data: buckets, error: listErr } = await sb.storage.listBuckets();
  if (listErr) throw listErr;
  if (Array.isArray(buckets) && buckets.some((b) => b.name === BUCKET)) return;
  const { error } = await sb.storage.createBucket(BUCKET, { public: true });
  if (error && !String(error.message || "").toLowerCase().includes("already exists")) {
    throw error;
  }
}

function makeObjectPath(args: { productId?: string; ext: string }): string {
  const dir = (args.productId || "draft").replace(/[^\w-]/g, "_").slice(0, 64) || "draft";
  const nonce = crypto.randomBytes(8).toString("hex");
  return `${dir}/${Date.now()}_${nonce}.${args.ext}`;
}

export async function handleAdminUploadProductImagePost(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const session = assertAdminSession(env, req);
  if (!session.ok) {
    res.statusCode = session.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: session.error, message: session.message }));
    return;
  }

  const url = getSupabaseUrl(env);
  const serviceKey = getSupabaseServiceRole(env);
  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const body = await readJsonBody(req);
  const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
  const productId = typeof body.productId === "string" ? body.productId : "";
  const decoded = decodeDataUrl(dataUrl);
  if (!decoded) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "invalid_data_url" }));
    return;
  }

  try {
    await ensureBucket(sb);
    const path = makeObjectPath({ productId, ext: decoded.ext });
    const { error } = await sb.storage
      .from(BUCKET)
      .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: true });
    if (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "upload_failed", message: error.message }));
      return;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, url: data.publicUrl, path }));
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "upload_failed", message: e?.message || String(e) }));
  }
}

export async function handleAdminMigrateProductImagesPost(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const session = assertAdminSession(env, req);
  if (!session.ok) {
    res.statusCode = session.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: session.error, message: session.message }));
    return;
  }

  const url = getSupabaseUrl(env);
  const serviceKey = getSupabaseServiceRole(env);
  const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    await ensureBucket(sb);

    const { data: rows, error } = await sb
      .from("landing_products")
      .select("id,image_src,image_srcs")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    let migrated = 0;
    let scanned = 0;

    for (const r of rows ?? []) {
      scanned++;
      const id = String((r as any).id || "").trim();
      const imageSrc = String((r as any).image_src || "").trim();
      const imageSrcs = Array.isArray((r as any).image_srcs) ? (r as any).image_srcs as unknown[] : [];

      const all = [imageSrc, ...imageSrcs.map((x) => (typeof x === "string" ? x : ""))].filter(Boolean) as string[];
      const hasData = all.some((x) => x.startsWith("data:image/"));
      if (!id || !hasData) continue;

      const nextUrls: string[] = [];
      for (const img of all) {
        if (!img.startsWith("data:image/")) {
          nextUrls.push(img);
          continue;
        }
        const decoded = decodeDataUrl(img);
        if (!decoded) continue;
        const path = makeObjectPath({ productId: id, ext: decoded.ext });
        const { error: upErr } = await sb.storage
          .from(BUCKET)
          .upload(path, decoded.bytes, { contentType: decoded.contentType, upsert: true });
        if (upErr) throw upErr;
        const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
        nextUrls.push(data.publicUrl);
      }

      const unique = nextUrls.filter((v, i, a) => a.indexOf(v) === i);
      const primary = unique[0] ?? "";
      if (!primary) continue;

      const { error: updErr } = await sb
        .from("landing_products")
        .update({ image_src: primary, image_srcs: unique })
        .eq("id", id);
      if (updErr) throw updErr;
      migrated++;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, scanned, migrated }));
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "migration_failed",
        message: e?.message || String(e),
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
      }),
    );
  }
}

