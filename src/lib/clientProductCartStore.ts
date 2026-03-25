import type { InstallmentMonths, LandingProduct } from "@/lib/productsStore";

export type ClientProductCartItem = {
  id: string;
  productId: string;
  months: InstallmentMonths;
  qty: number;
  addedAt: string;
};

const STORAGE_KEY = "zavo_client_product_cart_v1";
export const CLIENT_PRODUCT_CART_UPDATED_EVENT = "zavo:client-product-cart-updated";

export function loadClientProductCart(): ClientProductCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => {
        if (!x || typeof x !== "object") return null;
        const o = x as Record<string, unknown>;
        const id = typeof o.id === "string" ? o.id : "";
        const productId = typeof o.productId === "string" ? o.productId : "";
        const months = typeof o.months === "number" ? o.months : NaN;
        const qty = typeof o.qty === "number" ? o.qty : NaN;
        const addedAt = typeof o.addedAt === "string" ? o.addedAt : new Date().toISOString();
        if (!id || !productId) return null;
        if (![6, 12, 18, 24].includes(months)) return null;
        const safeQty = Number.isFinite(qty) ? Math.max(1, Math.min(99, Math.round(qty))) : 1;
        return { id, productId, months: months as InstallmentMonths, qty: safeQty, addedAt };
      })
      .filter(Boolean) as ClientProductCartItem[];
  } catch {
    return [];
  }
}

export function saveClientProductCart(items: ClientProductCartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new Event(CLIENT_PRODUCT_CART_UPDATED_EVENT));
  } catch {
    /* ignore */
  }
}

export function makeClientProductCartItemId(): string {
  return `cpc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pickDefaultMonths(product: LandingProduct): InstallmentMonths {
  const list = (product.enabledMonths?.length ? product.enabledMonths : [6, 12, 18, 24])
    .slice()
    .sort((a, b) => a - b);
  return (list[0] ?? 6) as InstallmentMonths;
}

