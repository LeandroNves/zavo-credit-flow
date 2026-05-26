import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const data = {
  nome_cliente: "Augusto (ADMIN)",
  profissao: "x",
  cpf: "111.111.111-11",
  rg: "1",
  data_nascimento: "01/01/1990",
  endereco: "Rua X",
  telefone: "11999999999",
  produtos_lista: "• Produto 1: iPhone 13\n• Produto 2: iPhone 14",
  valor_total: "5.000,00",
  valor_total_extenso: "cinco mil",
  num_parcelas: "12",
  valor_parcela: "416,67",
  valor_parcela_extenso: "quatrocentos",
  primeiro_vencimento: "10/05/2026",
  numero_contrato: "44-2028",
  data_local_assinatura: "[Goiânia GO], 26 de maio de 2026",
  nome_cliente_assinatura: "Augusto (ADMIN)",
};

function validateXml(xml, label) {
  const issues = [];
  const openR = (xml.match(/<w:r[\s>]/g) || []).length;
  const closeR = (xml.match(/<\/w:r>/g) || []).length;
  if (openR !== closeR) issues.push(`w:r ${openR}/${closeR}`);

  const openMc = (xml.match(/<mc:AlternateContent>/g) || []).length;
  const closeMc = (xml.match(/<\/mc:AlternateContent>/g) || []).length;
  if (openMc !== closeMc) issues.push(`mc ${openMc}/${closeMc}`);

  const openAnchor = (xml.match(/<wp:anchor/g) || []).length;
  const closeAnchor = (xml.match(/<\/wp:anchor>/g) || []).length;
  if (openAnchor !== closeAnchor) issues.push(`anchor ${openAnchor}/${closeAnchor}`);

  if (!xml.includes("Group 38")) issues.push("missing Group 38");
  if (!xml.includes("Graphic 35")) issues.push("missing Graphic 35");
  if (!xml.includes("COMPRADOR")) issues.push("missing COMPRADOR");

  // catastrophic footer fix leaves orphan positionV fragments
  if (/<wp:positionV[^>]*>[\s\S]*?<wp:positionV/.test(xml)) {
    issues.push("nested positionV");
  }

  console.log(label, issues.length ? issues : "OK");
}

const zip = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
const rendered = doc.getZip().file("word/document.xml").asText();
const sanitized = sanitizeContratoDocumentXml(rendered);

validateXml(rendered, "rendered");
validateXml(sanitized, "sanitized");

doc.getZip().file("word/document.xml", sanitized);
fs.writeFileSync("_test_contrato_safe.docx", doc.getZip().generate({ type: "nodebuffer" }));
console.log("Wrote _test_contrato_safe.docx");

const badRe =
  /(<wp:positionV relativeFrom=")paragraph("><wp:posOffset>)(\d{7,})(<\/wp:posOffset><\/wp:positionV>)([\s\S]*?name="Image 27")/g;
let m;
while ((m = badRe.exec(sanitized))) {
  console.log("BAD global match gap", m[5].length);
}
console.log("global footer regex matches:", badRe.test(sanitized) ? "yes" : "no");
badRe.lastIndex = 0;

// footer anchor check
const anchor = sanitized.match(/<wp:anchor[\s\S]*?name="Image 27"[\s\S]*?<\/wp:anchor>/)?.[0];
if (anchor) {
  console.log(
    "Image27 V:",
    anchor.match(/<wp:positionV[\s\S]*?<\/wp:positionV>/)?.[0]?.replace(/\s+/g, " "),
  );
}
