import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const templatePath = "api/_lib/templates/contrato.docx";

function analyzeXml(xml, label) {
  console.log(`\n========== ${label} ==========`);
  console.log("lastRenderedPageBreak:", (xml.match(/lastRenderedPageBreak/g) || []).length);
  console.log("top:41335 shapes:", (xml.match(/top:41335/g) || []).length);
  console.log("COMPRADOR:", xml.includes("COMPRADOR"));
  console.log("nome_cliente_assinatura:", xml.includes("{nome_cliente_assinatura}") || xml.includes("Augusto"));
  console.log("data_local_assinatura:", xml.includes("{data_local_assinatura}"));

  const body = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "";
  const paras = body.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
  console.log("paragraphs:", paras.length);

  // signature area
  for (let i = 0; i < paras.length; i++) {
    const t = [...paras[i].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join("");
    if (/COMPRADOR|VENDEDORA|assinatura|testemunhas/i.test(t)) {
      const hasLine =
        paras[i].includes("w:pBdr") ||
        paras[i].includes("w:bottom") ||
        paras[i].includes("border") ||
        paras[i].includes("underscore") ||
        paras[i].includes("_");
      console.log(
        `  p[${i}] text=${JSON.stringify(t.slice(0, 80))} drawing=${paras[i].includes("w:drawing")} vshape=${paras[i].includes("v:shape")} pBdr=${paras[i].includes("pBdr")}`,
      );
    }
  }

  // last 15 paragraphs summary
  console.log("\n--- last 15 paragraphs ---");
  for (let i = Math.max(0, paras.length - 15); i < paras.length; i++) {
    const t = [...paras[i].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join("")
      .trim();
    const p = paras[i];
    console.log(
      `  [${i}] t=${JSON.stringify(t.slice(0, 50))} draw=${p.includes("w:drawing")} vshape=${p.includes("v:shape")} anchor=${p.includes("wp:anchor")}`,
    );
  }
}

const data = {
  nome_cliente: "Augusto (ADMIN)",
  profissao: "x",
  cpf: "111.111.111-11",
  rg: "1",
  data_nascimento: "01/01/1990",
  endereco: "Rua X",
  telefone: "11999999999",
  produtos_lista:
    "• Produto 1: iPhone 13 White Marca/Modelo: iPhone 13; Cor: White; Número de Série: SN1; IMEI: 111; Estado do Bem (novo/usado): Novo; Acessórios Inclusos: Capa\n" +
    "• Produto 2: iPhone 14 Black Marca/Modelo: iPhone 14; Cor: Black; Número de Série: SN2; IMEI: 222; Estado do Bem (novo/usado): Novo; Acessórios Inclusos: Nenhum",
  valor_total: "R$ 5.000,00",
  valor_total_extenso: "cinco mil reais",
  num_parcelas: "12",
  valor_parcela: "R$ 416,67",
  valor_parcela_extenso: "quatrocentos reais",
  primeiro_vencimento: "10/05/2026",
  numero_contrato: "44-2028",
  data_local_assinatura: "[Goiânia GO], 26 de maio de 2026",
  nome_cliente_assinatura: "Augusto (ADMIN)",
};

const tplXml = new PizZip(fs.readFileSync(templatePath)).file("word/document.xml").asText();
analyzeXml(tplXml, "TEMPLATE (raw)");

const zip = new PizZip(fs.readFileSync(templatePath));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
const rendered = doc.getZip().file("word/document.xml").asText();
analyzeXml(rendered, "RENDERED (before sanitize)");

const sanitized = sanitizeContratoDocumentXml(rendered);
analyzeXml(sanitized, "SANITIZED");

// diff comprador signature area
const idx = (s) => s.indexOf("COMPRADOR");
console.log("\n--- COMPRADOR context rendered ---");
console.log(rendered.slice(idx - 200, idx + 1200).replace(/></g, ">\n<").slice(0, 2000));
console.log("\n--- COMPRADOR context sanitized ---");
console.log(sanitized.slice(sanitized.indexOf("COMPRADOR") - 200, sanitized.indexOf("COMPRADOR") + 1200).replace(/></g, ">\n<").slice(0, 2000));
