import { addMonths, format, lastDayOfMonth } from "date-fns";

/** Divide o valor total em N parcelas em reais (centavos distribuídos). */
export function splitTotalAcrossInstallments(total: number, n: number): number[] {
  if (n <= 0) return [];
  const centsTotal = Math.round(total * 100);
  const baseCents = Math.floor(centsTotal / n);
  let remainder = centsTotal - baseCents * n;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    let c = baseCents;
    if (remainder > 0) {
      c += 1;
      remainder -= 1;
    }
    out.push(c / 100);
  }
  return out;
}

/** Vencimento no mês, respeitando último dia (ex.: dia 31 em fevereiro). */
function dueDateInMonth(year: number, monthIndex: number, dueDay: number): Date {
  const last = lastDayOfMonth(new Date(year, monthIndex, 1));
  const day = Math.min(dueDay, last.getDate());
  return new Date(year, monthIndex, day);
}

/**
 * @param primeiroVencimentoYm — primeiro mês da 1ª parcela, formato `yyyy-MM`
 * @param count — quantidade de parcelas
 * @param dueDay — dia fixo (1–31)
 */
export function buildParcelaDueDates(
  primeiroVencimentoYm: string,
  count: number,
  dueDay: number,
): Date[] {
  const parts = primeiroVencimentoYm.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  if (!y || !m || m < 1 || m > 12) {
    const now = new Date();
    return Array.from({ length: count }, (_, i) =>
      dueDateInMonth(now.getFullYear(), now.getMonth() + i, dueDay),
    );
  }
  const dates: Date[] = [];
  for (let i = 0; i < count; i++) {
    const base = addMonths(new Date(y, m - 1, 1), i);
    dates.push(
      dueDateInMonth(base.getFullYear(), base.getMonth(), dueDay),
    );
  }
  return dates;
}

export function formatVencimentoBR(d: Date): string {
  return format(d, "dd/MM/yyyy");
}

export function parseBRDateToIso(vencimento: string): string {
  const p = vencimento.split("/").map((x) => parseInt(x, 10));
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) {
    return format(new Date(), "yyyy-MM-dd");
  }
  const [day, month, year] = p;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatIsoToBR(iso: string): string {
  const d = iso.split("T")[0];
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return iso;
  return `${day}/${m}/${y}`;
}
