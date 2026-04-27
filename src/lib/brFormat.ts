export function onlyDigits(v: string): string {
  return String(v || "").replace(/\D/g, "");
}

export function formatCPF(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function normalizeCPF(input: string): string {
  return onlyDigits(input).slice(0, 11);
}

export function formatTelefoneBR(input: string): string {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length < 3) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  // 10 dígitos total => (xx) xxxx-xxxx
  if (d.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`.replace(/-$/, "");
  }
  // 11 dígitos total => (xx) x xxxx-xxxx
  return `(${ddd}) ${rest.slice(0, 1)} ${rest.slice(1, 5)}-${rest.slice(5, 9)}`.replace(/-$/, "");
}

