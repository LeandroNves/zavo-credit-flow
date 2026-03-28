import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import {
  ALL_INSTALLMENTS,
  type InstallmentMonths,
  type LandingProduct,
} from "@/lib/productsStore";

type LandingProductRow = {
  id: string;
  name: string;
  color: string;
  price_cents: number;
  image_src: string;
  image_srcs: unknown;
  enabled_months: unknown;
  created_at: string;
  updated_at: string;
};

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

function mapRow(r: LandingProductRow): LandingProduct | null {
  const id = String(r.id ?? "").trim();
  const name = String(r.name ?? "").trim();
  const color = String(r.color ?? "").trim();
  const priceCents = Math.max(0, Math.round(Number(r.price_cents) || 0));
  let imageSrc = String(r.image_src ?? "").trim();
  let imageSrcs: string[] = [];
  if (Array.isArray(r.image_srcs)) {
    imageSrcs = r.image_srcs
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);
  }
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
    priceCents,
    imageSrc: primary,
    imageSrcs,
    enabledMonths: normalizeEnabledMonths(r.enabled_months),
    createdAt,
    updatedAt,
  };
}

export async function fetchLandingProductsFromSupabase(): Promise<LandingProduct[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("landing_products")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as LandingProductRow[];
  return rows.map(mapRow).filter(Boolean) as LandingProduct[];
}

/** Atualiza o catálogo quando o admin grava ou há mudança via Realtime. */
export function subscribeLandingProductsChanges(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => undefined;
  const channel = supabase
    .channel("landing_products_public")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "landing_products" },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
