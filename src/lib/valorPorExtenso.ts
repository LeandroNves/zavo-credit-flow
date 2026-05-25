const UNIDADES = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const DEZENAS = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const CENTENAS = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function extensoAte999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const d = Math.floor(r / 10);
  const u = r % 10;
  const parts: string[] = [];
  if (c > 0) parts.push(CENTENAS[c]!);
  if (r > 0 && r < 20) {
    parts.push(UNIDADES[r]!);
  } else if (r >= 20) {
    if (d > 0) parts.push(DEZENAS[d]!);
    if (u > 0) parts.push(UNIDADES[u]!);
  }
  return parts.filter(Boolean).join(" e ");
}

function extensoInteiro(n: number): string {
  if (n === 0) return "zero";
  if (n < 0) return `menos ${extensoInteiro(-n)}`;

  const bilhoes = Math.floor(n / 1_000_000_000);
  const milhoes = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const chunks: string[] = [];
  if (bilhoes > 0) {
    chunks.push(
      `${extensoAte999(bilhoes)} ${bilhoes === 1 ? "bilhão" : "bilhões"}`,
    );
  }
  if (milhoes > 0) {
    chunks.push(
      `${extensoAte999(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`,
    );
  }
  if (milhares > 0) {
    chunks.push(
      `${extensoAte999(milhares)} ${milhares === 1 ? "mil" : "mil"}`,
    );
  }
  if (resto > 0) chunks.push(extensoAte999(resto));

  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

/** Valor em reais por extenso (ex.: "cento e oitenta e seis reais e quinze centavos"). */
export function valorReaisPorExtenso(valor: number): string {
  const cents = Math.round(Math.abs(valor) * 100);
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisTxt =
    reais === 0
      ? ""
      : `${extensoInteiro(reais)} ${reais === 1 ? "real" : "reais"}`;
  const centTxt =
    centavos === 0
      ? ""
      : `${extensoInteiro(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`;
  if (reaisTxt && centTxt) return `${reaisTxt} e ${centTxt}`;
  return reaisTxt || centTxt || "zero reais";
}

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** Ex.: "10 de junho de 2026" a partir de dd/MM/yyyy */
export function dataBRPorExtenso(vencimentoBR: string): string {
  const p = vencimentoBR.trim().split("/").map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return vencimentoBR;
  const [day, month, year] = p;
  const mes = MESES[month - 1];
  if (!mes) return vencimentoBR;
  return `${day} de ${mes} de ${year}`;
}

/** Ex.: "DEZ de JUNHO de DOIS MIL E VINTE E SEIS" (texto do corpo da promissória). */
export function mesAnoPagamentoExtenso(vencimentoBR: string): string {
  const p = vencimentoBR.trim().split("/").map(Number);
  if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return "";
  const [day, month, year] = p;
  const mes = MESES[month - 1];
  if (!mes) return "";
  const diaTxt = extensoInteiro(day).toUpperCase();
  const mesUpper = mes.toUpperCase();
  const anoTxt = extensoInteiro(year).toUpperCase();
  return `${diaTxt} de ${mesUpper} de ${anoTxt}`;
}

/** Valor numérico sem "R$" (ex.: 186,15) para o campo ao lado do símbolo no modelo. */
export function formatMoedaNumeroBR(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Ex.: "12 de maio de 2026" para data de assinatura. */
export function dataAssinaturaExtenso(d: Date = new Date()): string {
  const day = d.getDate();
  const month = MESES[d.getMonth()] ?? "";
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export function formatMoedaBR(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
