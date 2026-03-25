import type { CartItem } from "@/lib/cartStore";
import type { LandingProduct } from "@/lib/productsStore";
import { calculateInstallmentCents, formatBRLFromCents } from "@/lib/productsStore";

export type RegistrationInterestType = "emprestimo" | "produto" | "ambos";

export type RegistrationCartSnapshotItem = {
  productId: string;
  name: string;
  color: string;
  months: 6 | 12 | 18 | 24;
  qty: number;
  perInstallmentBRL: string;
};

export type RegistrationCartSnapshot = {
  items: RegistrationCartSnapshotItem[];
};

const STORAGE_KEY = "zavo_registration_interest_v1";

export function loadRegistrationInterest(): {
  interestType: RegistrationInterestType | null;
  cart: RegistrationCartSnapshot | null;
} {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { interestType: null, cart: null };
    const parsed = JSON.parse(raw) as any;
    const interestType =
      parsed?.interestType === "emprestimo" ||
      parsed?.interestType === "produto" ||
      parsed?.interestType === "ambos"
        ? (parsed.interestType as RegistrationInterestType)
        : null;
    const cart = parsed?.cart && typeof parsed.cart === "object" ? (parsed.cart as RegistrationCartSnapshot) : null;
    return { interestType, cart };
  } catch {
    return { interestType: null, cart: null };
  }
}

export function saveRegistrationInterest(input: {
  interestType: RegistrationInterestType;
  cart: RegistrationCartSnapshot | null;
}) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    /* ignore */
  }
}

export function clearRegistrationInterest() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function buildCartSnapshot(args: {
  cartItems: CartItem[];
  products: LandingProduct[];
}): RegistrationCartSnapshot {
  const byId = new Map(args.products.map((p) => [p.id, p]));
  const items: RegistrationCartSnapshotItem[] = [];

  for (const it of args.cartItems) {
    const p = byId.get(it.productId);
    if (!p) continue;
    const per = calculateInstallmentCents(p.priceCents, it.months);
    items.push({
      productId: p.id,
      name: p.name,
      color: p.color,
      months: it.months,
      qty: it.qty,
      perInstallmentBRL: formatBRLFromCents(per),
    });
  }

  return { items };
}

