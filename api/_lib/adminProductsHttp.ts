import type { IncomingMessage, ServerResponse } from "node:http";
import { createClient } from "@supabase/supabase-js";
import {
  getAdminPassword,
  getAdminUsername,
  getSessionSecret,
  getSupabaseServiceRole,
  getSupabaseUrl,
} from "./adminEnv.js";
import { parseSessionCookie } from "./sessionCookie.js";

const MAX_PRODUCTS = 200;

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

function isInstallmentMonths(n: number): boolean {
  return n === 6 || n === 12 || n === 18 || n === 24;
}

function normalizeEnabledMonths(raw: unknown): number[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out = arr
    .map((x) => (typeof x === "number" ? x : Number.NaN))
    .filter((x) => Number.isFinite(x) && isInstallmentMonths(x));
  const unique = [...new Set(out)].sort((a, b) => a - b);
  return unique.length ? unique : [6, 12, 18, 24];
}

function productBodyToRpcRow(p: unknown): Record<string, unknown> | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const color = typeof o.color === "string" ? o.color.trim() : "";
  const priceRaw = o.priceCents;
  const priceCents =
    typeof priceRaw === "number" && Number.isFinite(priceRaw)
      ? Math.max(0, Math.round(priceRaw))
      : Number.NaN;
  const imageSrc = typeof o.imageSrc === "string" ? o.imageSrc.trim() : "";
  const imageSrcsRaw = Array.isArray(o.imageSrcs) ? o.imageSrcs : [];
  const imageSrcs = imageSrcsRaw
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const primary = imageSrcs[0] || imageSrc;
  if (!id || !name || !primary) return null;
  if (!Number.isFinite(priceCents) || priceCents <= 0) return null;

  const nowIso = new Date().toISOString();
  const createdAt =
    typeof o.createdAt === "string" && o.createdAt.trim() ? o.createdAt.trim() : nowIso;
  const updatedAt =
    typeof o.updatedAt === "string" && o.updatedAt.trim() ? o.updatedAt.trim() : nowIso;

  return {
    id,
    name,
    color: color || "",
    price_cents: priceCents,
    image_src: primary,
    image_srcs: imageSrcs.length ? imageSrcs : [primary],
    enabled_months: normalizeEnabledMonths(o.enabledMonths),
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

export async function handleAdminProductsPost(
  env: NodeJS.ProcessEnv,
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
): Promise<void> {
  const secret = getSessionSecret(env);
  const user = getAdminUsername(env);
  const pass = getAdminPassword(env);
  if (!secret || !user || !pass) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "admin_not_configured" }));
    return;
  }
  if (!parseSessionCookie(secret, req.headers.cookie).ok) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
    return;
  }

  const url = getSupabaseUrl(env);
  const serviceKey = getSupabaseServiceRole(env);
  if (!url || !serviceKey) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "supabase_not_configured" }));
    return;
  }

  const body = await readJsonBody(req);
  const products = body.products;
  if (!Array.isArray(products)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "invalid_body" }));
    return;
  }
  if (products.length > MAX_PRODUCTS) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "too_many_products",
        max: MAX_PRODUCTS,
      }),
    );
    return;
  }

  const items: Record<string, unknown>[] = [];
  for (let i = 0; i < products.length; i++) {
    const row = productBodyToRpcRow(products[i]);
    if (!row) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: "invalid_product", index: i }));
      return;
    }
    items.push(row);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await sb.rpc("replace_landing_products", { items });
  if (error) {
    console.error("[admin products] rpc replace_landing_products:", error.message);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "replace_failed",
        message: error.message,
      }),
    );
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
