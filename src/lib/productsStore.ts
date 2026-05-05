export type InstallmentMonths = 1 | 6 | 12 | 18 | 24;

export const PRODUCT_CATEGORIES = [
  "Celular",
  "Tablet",
  "Notebook",
  "Smartwatch",
  "Fone de ouvido",
  "Caixa de som",
  "Acessório",
  "Assistência técnica",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Motorola",
  "Lenovo",
  "Dell",
  "HP",
  "Asus",
  "JBL",
  "Sony",
  "Starlink",
  "Baseus",
] as const;

export type ProductBrand = (typeof PRODUCT_BRANDS)[number];

export type ProductModelOption = {
  model: string;
  priceCents: number;
};

export type LandingProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  brand: ProductBrand;
  isOnSale: boolean;
  color: string;
  description: string;
  deliveryTime: string;
  specifications: string[];
  modelOptions: ProductModelOption[];
  priceCents: number;
  imageSrc: string;
  imageSrcs: string[];
  enabledMonths: InstallmentMonths[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "zavo_landing_products_v1";
export const PRODUCTS_UPDATED_EVENT = "zavo:products-updated";

export const INSTALLMENT_RATES: Record<InstallmentMonths, number> = {
  1: 0,
  6: 0.88,
  12: 1.47,
  18: 1.94,
  24: 2.43,
};

export const ALL_INSTALLMENTS: InstallmentMonths[] = [6, 12, 18, 24];

function isInstallmentMonths(n: number): n is InstallmentMonths {
  return n === 1 || n === 6 || n === 12 || n === 18 || n === 24;
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeNumber(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normalizeCategory(v: unknown): ProductCategory {
  const value = typeof v === "string" ? v.trim() : "";
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
    ? (value as ProductCategory)
    : "Celular";
}

function normalizeBrand(v: unknown): ProductBrand {
  const value = typeof v === "string" ? v.trim() : "";
  return (PRODUCT_BRANDS as readonly string[]).includes(value)
    ? (value as ProductBrand)
    : "Apple";
}

function normalizeStringArray(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : [];
  return raw
    .map((x) => safeString(x).trim())
    .filter(Boolean)
    .filter((x, i, a) => a.indexOf(x) === i);
}

function normalizeModelOptions(v: unknown): ProductModelOption[] {
  const raw = Array.isArray(v) ? v : [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const model = safeString(obj.model).trim();
      const priceCents = Math.max(0, Math.round(safeNumber(obj.priceCents)));
      if (!model || priceCents <= 0) return null;
      return { model, priceCents };
    })
    .filter(Boolean)
    .filter((x, i, arr) => arr.findIndex((y) => y?.model.toLowerCase() === x?.model.toLowerCase()) === i) as ProductModelOption[];
}

function normalizeEnabledMonths(v: unknown): InstallmentMonths[] {
  const raw = Array.isArray(v) ? v : [];
  const out = raw
    .map((x) => (typeof x === "number" ? x : Number.NaN))
    .filter((x): x is number => Number.isFinite(x) && isInstallmentMonths(x))
    .filter((x, i, a) => a.indexOf(x) === i)
    .sort((a, b) => a - b) as InstallmentMonths[];
  return out.length ? out : ALL_INSTALLMENTS;
}

function normalizeProduct(p: unknown): LandingProduct | null {
  if (!p || typeof p !== "object") return null;
  const obj = p as Record<string, unknown>;

  const id = safeString(obj.id).trim();
  const name = safeString(obj.name).trim();
  const category = normalizeCategory(obj.category);
  const brand = normalizeBrand(obj.brand);
  const isOnSale = Boolean(obj.isOnSale);
  const color = safeString(obj.color).trim();
  const description = safeString(obj.description).trim();
  const deliveryTime = safeString(obj.deliveryTime).trim();
  const specifications = normalizeStringArray(obj.specifications);
  const modelOptions = normalizeModelOptions(obj.modelOptions);
  const imageSrc = safeString(obj.imageSrc).trim();
  const imageSrcsRaw = Array.isArray(obj.imageSrcs) ? obj.imageSrcs : [];
  const imageSrcs = imageSrcsRaw
    .map((v) => safeString(v).trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);
  const primaryImageSrc = imageSrcs[0] || imageSrc;
  const rawPriceCents = Math.max(0, Math.round(safeNumber(obj.priceCents)));
  const priceCents =
    modelOptions.length > 0
      ? Math.min(...modelOptions.map((x) => x.priceCents))
      : rawPriceCents;

  if (!id || !name || !primaryImageSrc) return null;

  const nowIso = new Date().toISOString();
  const createdAt = safeString(obj.createdAt) || nowIso;
  const updatedAt = safeString(obj.updatedAt) || nowIso;

  return {
    id,
    name,
    category,
    brand,
    isOnSale,
    color,
    description,
    deliveryTime,
    specifications,
    modelOptions,
    imageSrc: primaryImageSrc,
    imageSrcs: imageSrcs.length ? imageSrcs : [primaryImageSrc],
    priceCents,
    enabledMonths: normalizeEnabledMonths(obj.enabledMonths),
    createdAt,
    updatedAt,
  };
}

export function loadLandingProducts(seed?: LandingProduct[]): LandingProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (seed?.length) {
        saveLandingProducts(seed);
        return seed;
      }
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map(normalizeProduct).filter(Boolean) as LandingProduct[];
    if (normalized.length === 0) return [];
    return normalized;
  } catch {
    return seed?.length ? seed : [];
  }
}

export function saveLandingProducts(list: LandingProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota errors */
  }
  try {
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

export function formatBRLFromCents(cents: number): string {
  const value = (Math.round(cents) || 0) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function charmRoundToTenMinusOneCent(perInstallmentCents: number): number {
  return Math.max(0, Math.floor(perInstallmentCents));
}

export function calculateInstallmentCents(priceCents: number, months: InstallmentMonths): number {
  const rate = INSTALLMENT_RATES[months];
  const totalCents = Math.round(priceCents * (1 + rate));
  const rawPerInstallment = totalCents / months;
  return charmRoundToTenMinusOneCent(rawPerInstallment);
}

export type DownPaymentOptionId = "none" | "light" | "medium" | "high";

export type DownPaymentOption = {
  id: DownPaymentOptionId;
  label: string;
  entryPercent: number;
  totalDiscountPercent: number;
};

export const DOWN_PAYMENT_OPTIONS: DownPaymentOption[] = [
  { id: "none", label: "Sem entrada", entryPercent: 0, totalDiscountPercent: 0 },
  { id: "light", label: "Entrada leve", entryPercent: 0.1, totalDiscountPercent: 0.1 },
  { id: "medium", label: "Entrada média", entryPercent: 0.2, totalDiscountPercent: 0.15 },
  { id: "high", label: "Entrada alta", entryPercent: 0.3, totalDiscountPercent: 0.2 },
];

export function getDownPaymentOptionById(id: string): DownPaymentOption {
  return DOWN_PAYMENT_OPTIONS.find((x) => x.id === id) ?? DOWN_PAYMENT_OPTIONS[0];
}

export function calculateInstallmentWithDownPaymentCents(args: {
  priceCents: number;
  months: InstallmentMonths;
  downPaymentOptionId: DownPaymentOptionId;
}): {
  basePlanTotalCents: number;
  discountedPlanTotalCents: number;
  downPaymentCents: number;
  financedTotalCents: number;
  perInstallmentCents: number;
  earlyPaymentPerInstallmentCents: number;
} {
  const option = getDownPaymentOptionById(args.downPaymentOptionId);
  const rate = INSTALLMENT_RATES[args.months];
  const basePlanTotalCents = Math.round(args.priceCents * (1 + rate));
  const discountedPlanTotalCents = Math.round(basePlanTotalCents * (1 - option.totalDiscountPercent));
  const downPaymentCents = Math.round(args.priceCents * option.entryPercent);
  const financedTotalCents = Math.max(0, discountedPlanTotalCents - downPaymentCents);
  const perInstallmentCents = Math.max(0, Math.floor(financedTotalCents / args.months));
  const earlyPaymentPerInstallmentCents = Math.max(0, Math.floor(perInstallmentCents * 0.85));
  return {
    basePlanTotalCents,
    discountedPlanTotalCents,
    downPaymentCents,
    financedTotalCents,
    perInstallmentCents,
    earlyPaymentPerInstallmentCents,
  };
}

export function makeProductId(): string {
  // bom o suficiente para chave local (sem dependências)
  return `prod_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseProductColors(colorField: string): string[] {
  return String(colorField || "")
    .split(/[,/|]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x, i, arr) => arr.indexOf(x) === i);
}

export function getProductModelOptions(product: LandingProduct): ProductModelOption[] {
  if (product.modelOptions?.length) return product.modelOptions;
  const specs = (product.specifications ?? [])
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x, i, arr) => arr.indexOf(x) === i);
  if (!specs.length || product.priceCents <= 0) return [];
  return specs.map((model) => ({ model, priceCents: product.priceCents }));
}

export function getDefaultProductModel(product: LandingProduct): string {
  const options = getProductModelOptions(product);
  return options[0]?.model ?? "";
}

export function getProductPriceCentsByModel(product: LandingProduct, model: string): number {
  const options = getProductModelOptions(product);
  if (!options.length) return product.priceCents;
  const chosen = options.find((x) => x.model === model);
  return chosen?.priceCents ?? options[0].priceCents;
}

