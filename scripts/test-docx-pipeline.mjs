import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const tpl = "api/_lib/templates/contrato.docx";
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

function check(label, buf) {
  const zip = new PizZip(buf);
  const files = Object.keys(zip.files);
  const doc = zip.file("word/document.xml");
  if (!doc) {
    console.log(label, "FAIL: no document.xml");
    return false;
  }
  const xml = doc.asText();
  const issues = [];
  if ((xml.match(/<w:r[\s>]/g) || []).length !== (xml.match(/<\/w:r>/g) || []).length)
    issues.push("w:r");
  if ((xml.match(/<mc:AlternateContent>/g) || []).length !== (xml.match(/<\/mc:AlternateContent>/g) || []).length)
    issues.push("mc");
  if ((xml.match(/<wp:anchor/g) || []).length !== (xml.match(/<\/wp:anchor>/g) || []).length)
    issues.push("anchor");
  if (!xml.includes("</w:body>")) issues.push("no body close");
  console.log(label, issues.length ? `ISSUES: ${issues.join(",")}` : "xml tags OK", `files=${files.length} size=${buf.length}`);
  return issues.length === 0;
}

// 1) template raw copy
fs.copyFileSync(tpl, "_out_0_template_copy.docx");
check("0-template-copy", fs.readFileSync("_out_0_template_copy.docx"));

// 2) render only
const zip = new PizZip(fs.readFileSync(tpl));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
const rendered = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync("_out_1_rendered.docx", rendered);
check("1-rendered", rendered);

// 3) sanitize via string on zip before generate
const xml = doc.getZip().file("word/document.xml").asText();
const steps = {
  breaks: (x) => x.replace(/<w:lastRenderedPageBreak\s*\/>/g, ""),
};
let s = xml;
fs.writeFileSync(
  "_out_2_breaks_only.docx",
  (() => {
    const z = new PizZip(fs.readFileSync(tpl));
    const d = new Docxtemplater(z, {
      paragraphLoop: false,
      linebreaks: true,
      delimiters: { start: "{", end: "}" },
      nullGetter: () => "",
    });
    d.render(data);
    d.getZip().file("word/document.xml", steps.breaks(d.getZip().file("word/document.xml").asText()));
    return d.getZip().generate({ type: "nodebuffer" });
  })(),
);
check("2-breaks-only", fs.readFileSync("_out_2_breaks_only.docx"));

// 4) full sanitize
doc.getZip().file("word/document.xml", sanitizeContratoDocumentXml(xml));
const sanitized = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync("_out_3_sanitized.docx", sanitized);
check("3-full-sanitize", sanitized);

// 5) double zip like sanitizeContratoDocxBuffer
const z2 = new PizZip(rendered);
z2.file("word/document.xml", sanitizeContratoDocumentXml(z2.file("word/document.xml").asText()));
const double = z2.generate({ type: "nodebuffer" });
fs.writeFileSync("_out_4_double_zip.docx", double);
check("4-double-zip-sanitize", double);

console.log("\nTest files written: _out_0..4.docx — open each in Word to see which fails.");
