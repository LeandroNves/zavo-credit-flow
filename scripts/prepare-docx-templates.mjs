/**
 * Converte os modelos Word (texto de exemplo em azul) em placeholders {chave} para docxtemplater.
 * Execute: node scripts/prepare-docx-templates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src", "assets", "modelos");
const outDir = path.join(root, "api", "_lib", "templates");

const CONTRATO_REPLACEMENTS = [
  ["025.233.061-74", "{cpf}"],
  ["4419358", "{rg}"],
  ["Doméstica", "{profissao}"],
  ["Domestica", "{profissao}"],
  ["20/04/1978", "{data_nascimento}"],
  [
    "Rua Tomaz de Aquino Calado, N. 333, Setor Central, CEP 75660-000; Buriti Alegre GO",
    "{endereco}",
  ],
  ["64 98137-8448", "{telefone}"],
  ["Cristina Maria Domingos", "{nome_cliente}"],
  ["Aparelho celular", "{produto_categoria}"],
  ["Apple iPhone 8 64GB – MQ6H2LZ/A", "{produto_modelo}"],
  ["Apple iPhone 8 64GB - MQ6H2LZ/A", "{produto_modelo}"],
  ["Branco", "{produto_cor}"],
  ["F4GVKC0WJC68", "{produto_serie}"],
  ["35 675808 523359 4", "{produto_imei}"],
  ["Usado", "{produto_estado}"],
  ["Acessórios Inclusos: Não", "Acessórios Inclusos: {produto_acessorios}"],
  ["Acessorios Inclusos: Nao", "Acessorios Inclusos: {produto_acessorios}"],
  ["R$ 1.116,90", "{valor_total}"],
  ["1.116,90", "{valor_total}"],
  ["um mil, cento e dezesseis reais e noventa centavos", "{valor_total_extenso}"],
  ["em 6 (seis) parcelas", "em {num_parcelas} parcelas"],
  ["N. 122-2026", "N. {numero_contrato}"],
  ["R$ 186,15", "{valor_parcela}"],
  ["186,15", "{valor_parcela}"],
  ["cento e oitenta e seis reais e quinze centavos", "{valor_parcela_extenso}"],
  ["10/06/2026", "{primeiro_vencimento}"],
  ["122-2026", "{numero_contrato}"],
  ["[Goiânia GO], 12 de Maio de 2026", "{data_local_assinatura}"],
  ["[Goiania GO], 12 de Maio de 2026", "{data_local_assinatura}"],
];

const PROMISSORIA_REPLACEMENTS = [
  ["N. #1/6#", "{parcela_label}"],
  ["10 de Junho de 2026", "{vencimento_extenso}"],
  ["R$ 186,15", "{valor_parcela}"],
  [
    "CENTO E OITENTA E SEIS REAIS E QUINZECENTAVOS",
    "{valor_parcela_extenso_upper}",
  ],
  [
    "DEZ  de JUNHO de DOIS MIL E VINTE E SEIS",
    "{mes_pagamento_extenso}",
  ],
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

/** Substitui texto mesmo quando partido entre vários <w:t> no OOXML. */
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

function applyReplacements(xml, pairs) {
  let out = xml;
  for (const [from, to] of pairs) {
    out = flexReplace(out, from, to);
  }
  // Nome partido em vários runs do Word
  if (!out.includes("{nome_cliente}")) {
    out = flexReplace(out, "Cristina", "{nome_cliente}");
  }
  // Sobrenome do modelo (runs separados após {nome_cliente})
  out = out.replace(
    /(\{nome_cliente\}<\/w:t><\/w:r>)(<w:r[\s\S]*?<w:t> <\/w:t><\/w:r>)(<w:r[\s\S]*?<w:t>Maria<\/w:t><\/w:r>)(<w:r[\s\S]*?<w:t> <\/w:t><\/w:r>)(<w:r[\s\S]*?<w:t>Domingos<\/w:t><\/w:r>)/,
    "$1",
  );
  // Endereço em dezenas de runs entre o rótulo e Telefone:
  out = out.replace(
    /(Endere[çc]o:<\/w:t><\/w:r>)[\s\S]*?(<w:r[\s\S]*?<w:t>Telefone:<\/w:t>)/,
    '$1<w:r><w:rPr><w:b/><w:color w:val="123A7C"/><w:sz w:val="24"/></w:rPr><w:t>{endereco}</w:t></w:r>$2',
  );
  out = flexReplace(out, "Apple iPhone 8 64GB", "{produto_modelo}");
  out = flexReplace(out, " MQ6H2LZ/A", "");
  out = flexReplace(out, "35 675808 523359 4", "{produto_imei}");
  out = flexReplace(out, "Acessórios Inclusos: Não", "Acessórios Inclusos: {produto_acessorios}");
  out = flexReplace(out, "um mil, cento e dezesseis reais e noventa centavos", "{valor_total_extenso}");
  out = flexReplace(out, "em 6 (seis) parcelas", "em {num_parcelas} parcelas");
  out = flexReplace(out, "ALIENAÇÃO FIDUCIÁRIA N. 122-2026", "ALIENAÇÃO FIDUCIÁRIA N. {numero_contrato}");
  return out;
}

function prepareDocx(inputPath, outputPath, pairs) {
  const buf = fs.readFileSync(inputPath);
  const zip = new PizZip(buf);
  const xmlPath = "word/document.xml";
  let xml = zip.file(xmlPath).asText();
  xml = applyReplacements(xml, pairs);
  zip.file(xmlPath, xml);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, zip.generate({ type: "nodebuffer" }));
  console.log("OK", path.basename(outputPath));
}

function findDocx(namePart) {
  const files = fs.readdirSync(srcDir);
  const hit = files.find((f) => f.toLowerCase().includes(namePart.toLowerCase()));
  if (!hit) throw new Error(`Modelo não encontrado: ${namePart} em ${srcDir}`);
  return path.join(srcDir, hit);
}

fs.mkdirSync(outDir, { recursive: true });
prepareDocx(
  findDocx("CONTRATO"),
  path.join(outDir, "contrato.docx"),
  CONTRATO_REPLACEMENTS,
);
prepareDocx(
  findDocx("romis"),
  path.join(outDir, "promissoria.docx"),
  PROMISSORIA_REPLACEMENTS,
);
