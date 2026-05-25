/**
 * Converte textos de exemplo em placeholders s1_ / s2_ / s3_ (modelo novo).
 * Se o .docx já tiver {s1_parcela_label} etc., não faz nada.
 *
 * Feche o Word antes de rodar:
 *   node scripts/prepare-promissoria-3up.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatePath = path.join(
  __dirname,
  "..",
  "api",
  "_lib",
  "templates",
  "promissoria.docx",
);

const SAMPLES = [
  ["N. #1/6#", "{parcela_label}"],
  ["10 de Junho de 2026", "{vencimento_extenso}"],
  ["186,15", "{valor_parcela_numero}"],
  ["R$ 186,15", "{valor_parcela}"],
  [
    "CENTO E OITENTA E SEIS REAIS E QUINZE CENTAVOS",
    "{valor_parcela_extenso_upper}",
  ],
  [
    "CENTO E OITENTA E SEIS REAIS E QUINZECENTAVOS",
    "{valor_parcela_extenso_upper}",
  ],
  ["DEZ  de JUNHO de DOIS MIL E VINTE E SEIS", "{mes_pagamento_extenso}"],
  ["DEZ de JUNHO de DOIS MIL E VINTE E SEIS", "{mes_pagamento_extenso}"],
  ["Buriti Alegre GO", "{local_pagamento}"],
  ["Cristina Maria Domingos", "{nome_cliente}"],
  ["7025.233.061-74", "{cpf}"],
  ["025.233.061-74", "{cpf}"],
  [
    "Rua Tomaz de Aquino Calado, N. 333, Setor Central, Buriti Alegre GO, CEP 75660-000",
    "{endereco}",
  ],
  ["12/05/2026", "{data_emissao}"],
];

function flexReplace(xml, from, to) {
  if (!from) return xml;
  if (xml.includes(from)) return xml.split(from).join(to);
  const pattern = [...from]
    .map((ch) => `${ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:</w:t>[^<]*<w:t[^>]*>)*`)
    .join("");
  try {
    return xml.replace(new RegExp(pattern, "g"), to);
  } catch {
    return xml;
  }
}

function tagWithPrefix(tag, prefix) {
  return tag.startsWith("{") && tag.endsWith("}")
    ? `{${prefix}_${tag.slice(1, -1)}}`
    : tag;
}

function applySamples(xml, prefix) {
  let out = xml;
  for (const [from, tag] of SAMPLES) {
    out = flexReplace(out, from, tagWithPrefix(tag, prefix));
  }
  if (!out.includes(`${prefix}_nome_cliente`)) {
    out = flexReplace(out, "Cristina", `{${prefix}_nome_cliente}`);
  }
  return out;
}

/** Word quebra "NOTA PROMISSÓRIA" em vários <w:t>; PROMISSÓRIA sozinha é mais estável. */
function findBlockStarts(xml) {
  const starts = [];
  const re = /PROMISS[ÓO]RIA/gi;
  let m;
  while ((m = re.exec(xml))) starts.push(m.index);
  return starts;
}

function isAlreadyPrepared(xml) {
  return xml.includes("{s1_parcela_label}") || xml.includes("s1_parcela_label");
}

function main() {
  if (!fs.existsSync(templatePath)) {
    console.error("Arquivo não encontrado:", templatePath);
    process.exit(1);
  }
  const zip = new PizZip(fs.readFileSync(templatePath));
  const xmlPath = "word/document.xml";
  let xml = zip.file(xmlPath).asText();

  if (isAlreadyPrepared(xml)) {
    const promiss = findBlockStarts(xml).length;
    const hasSlot2 = xml.includes("{#slot2}") || xml.includes("#slot2");
    const hasSlot3 = xml.includes("{#slot3}") || xml.includes("#slot3");
    console.log("OK: modelo já está com variáveis (s1_, s2_, s3_).");
    console.log(`   Blocos PROMISSÓRIA no XML: ${promiss}`);
    console.log(`   {#slot2}: ${hasSlot2 ? "sim" : "não"} | {#slot3}: ${hasSlot3 ? "sim" : "não"}`);
    console.log("   Não é preciso rodar este script de novo.");
    console.log("   Salve o .docx e teste Promissórias Word no admin.");
    return;
  }

  const starts = findBlockStarts(xml);
  if (starts.length < 1) {
    console.error(
      "Nenhum bloco PROMISSÓRIA encontrado. Abra o .docx e confira o título NOTA PROMISSÓRIA.",
    );
    process.exit(1);
  }

  const prefixes = ["s1", "s2", "s3"];
  const pageSize = 3;
  const pageEnd = starts.length >= pageSize ? starts[pageSize] : xml.length;
  const pageStart = starts[0];

  for (let i = 0; i < Math.min(pageSize, starts.length); i++) {
    const from = starts[i];
    const to = i + 1 < starts.length ? starts[i + 1] : pageEnd;
    const block = xml.slice(from, to);
    const replaced = applySamples(block, prefixes[i]);
    xml = xml.slice(0, from) + replaced + xml.slice(to);
    const delta = replaced.length - block.length;
    for (let j = i + 1; j < starts.length; j++) starts[j] += delta;
    if (i + 1 === pageSize) break;
  }

  const before = xml.slice(0, pageStart);
  const after = xml.slice(pageEnd);
  xml = before + xml.slice(pageStart, pageEnd) + after;

  zip.file(xmlPath, xml);
  const outBuf = zip.generate({ type: "nodebuffer" });
  try {
    fs.writeFileSync(templatePath, outBuf);
    console.log("OK:", templatePath);
  } catch (e) {
    const alt = templatePath.replace(/\.docx$/i, ".prepared.docx");
    fs.writeFileSync(alt, outBuf);
    console.warn("Arquivo em uso. Salvo em:", alt);
  }
  console.log(
    `Convertido 1ª página (${Math.min(pageSize, starts.length)} blocos). Total PROMISSÓRIA no arquivo: ${starts.length}.`,
  );
}

main();
