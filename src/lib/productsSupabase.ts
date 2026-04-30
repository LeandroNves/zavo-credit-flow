import { RealtimeClient } from "@supabase/realtime-js";
import {
  ALL_INSTALLMENTS,
  type InstallmentMonths,
  type LandingProduct,
} from "@/lib/productsStore";

const catalogUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const catalogAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Mesmo critério do app: URL + anon para leitura pública do catálogo. */
export const isCatalogSupabaseConfigured = Boolean(catalogUrl && catalogAnonKey);

type LandingProductRow = {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  delivery_time?: string | null;
  specifications?: unknown;
  price_cents: number;
  image_src: string;
  image_srcs: unknown;
  enabled_months: unknown;
  created_at: string;
  updated_at: string;
};

let landingRealtime: RealtimeClient | null = null;

function getLandingRealtime(): RealtimeClient | null {
  if (!catalogUrl || !catalogAnonKey) return null;
  if (!landingRealtime) {
    const u = new URL("realtime/v1", catalogUrl);
    u.protocol = u.protocol.replace("http", "ws");
    landingRealtime = new RealtimeClient(u.href, {
      params: { apikey: catalogAnonKey },
    });
  }
  return landingRealtime;
}

function isInstallmentMonths(n: number): n is InstallmentMonths {
  return n === 6 || n === 12 || n === 18 || n === 24;
}

function normalizeEnabledMonths(raw: unknown): InstallmentMonths[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out = arr
    .map((x) => (typeof x === "number" ? x : Number.NaN))
    .filter((x): x is number => Number.isFinite(x) && isInstallmentMonths(x))
    .filter((x, i, a) => a.indexOf(x) === i)
    .sort((a, b) => a - b) as InstallmentMonths[];
  return out.length ? out : ALL_INSTALLMENTS;
}

function parseImageSrcs(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) arr = p;
    } catch {
      return [];
    }
  }
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function parseStringArray(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) arr = p;
    } catch {
      return [];
    }
  }
  return arr
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
}

function mapRow(r: LandingProductRow): LandingProduct | null {
  const id = String(r.id ?? "").trim();
  const name = String(r.name ?? "").trim();
  const color = String(r.color ?? "").trim();
  const description = String(r.description ?? "").trim();
  const deliveryTime = String(r.delivery_time ?? "").trim();
  const specifications = parseStringArray(r.specifications);
  const priceCents = Math.max(0, Math.round(Number(r.price_cents) || 0));
  let imageSrc = String(r.image_src ?? "").trim();
  let imageSrcs = parseImageSrcs(r.image_srcs);
  const primary = imageSrcs[0] || imageSrc;
  if (!id || !name || !primary) return null;
  if (!imageSrc) imageSrc = primary;
  if (!imageSrcs.length) imageSrcs = [primary];
  const nowIso = new Date().toISOString();
  const createdAt = String(r.created_at ?? "").trim() || nowIso;
  const updatedAt = String(r.updated_at ?? "").trim() || nowIso;
  return {
    id,
    name,
    color,
    description,
    deliveryTime,
    specifications,
    priceCents,
    imageSrc: primary,
    imageSrcs,
    enabledMonths: normalizeEnabledMonths(r.enabled_months),
    createdAt,
    updatedAt,
  };
}

/**
 * REST direto com Bearer anon — sem segundo GoTrueClient (evita conflito de instância + sessão de usuário).
 */
export async function fetchLandingProductsFromSupabase(): Promise<LandingProduct[]> {
  if (!catalogUrl || !catalogAnonKey) return [];
  const q = "select=*&order=updated_at.desc";
  const res = await fetch(`${catalogUrl}/rest/v1/landing_products?${q}`, {
    headers: {
      apikey: catalogAnonKey,
      Authorization: `Bearer ${catalogAnonKey}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`landing_products ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as unknown;
  const rows = Array.isArray(data) ? (data as LandingProductRow[]) : [];
  return rows.map(mapRow).filter(Boolean) as LandingProduct[];
}

/**
 * Realtime sem Supabase Auth — só WebSocket + apikey anon.
 */
export function subscribeLandingProductsChanges(onChange: () => void): () => void {
  const rt = getLandingRealtime();
  if (!rt) return () => undefined;
  const topic = `landing_products:${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const channel = rt
    .channel(topic)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "landing_products" },
      () => onChange(),
    );
  channel.subscribe();
  return () => {
    void rt.removeChannel(channel);
  };
}
