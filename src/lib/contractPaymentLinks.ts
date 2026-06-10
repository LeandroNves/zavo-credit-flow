export type ContractPaymentLink = {
  label: string;
  url: string;
};

export function emptyPaymentLink(): ContractPaymentLink {
  return { label: "", url: "" };
}

export function normalizePaymentLinks(raw: unknown): ContractPaymentLink[] {
  if (!Array.isArray(raw)) return [emptyPaymentLink()];
  const parsed = raw
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const o = item as Record<string, unknown>;
      return {
        label: String(o.label ?? "").trim(),
        url: String(o.url ?? "").trim(),
      };
    })
    .filter((l) => l.label.length > 0 || l.url.length > 0);
  return parsed.length > 0 ? parsed : [emptyPaymentLink()];
}

/** Para salvar: remove linhas totalmente vazias. */
export function paymentLinksForSave(links: ContractPaymentLink[]): ContractPaymentLink[] {
  return links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter((l) => l.label.length > 0 && l.url.length > 0);
}

export function isValidPaymentUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
