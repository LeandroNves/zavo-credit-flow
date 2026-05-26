import fs from "node:fs";
import PizZip from "pizzip";

const path = "api/_lib/templates/contrato.docx";
const zip = new PizZip(fs.readFileSync(path));
const xml = zip.file("word/document.xml").asText();

console.log("=== contrato.docx structure ===");
console.log("page breaks (w:br):", (xml.match(/w:type="page"/g) || []).length);
console.log("sectPr:", (xml.match(/<w:sectPr/g) || []).length);
console.log("lastRenderedPageBreak:", (xml.match(/w:lastRenderedPageBreak/g) || []).length);

// section breaks between paragraphs
const sectBreaks = xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g) || [];
console.log("sectPr blocks:", sectBreaks.length);

// Count paragraphs that are nearly empty at document level - sample
const paras = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
let emptyNearEnd = 0;
for (let i = Math.max(0, paras.length - 15); i < paras.length; i++) {
  const p = paras[i];
  const text = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("");
  const hasDrawing = p.includes("<w:drawing") || p.includes("v:shape");
  if (!text.trim() && !hasDrawing) emptyNearEnd++;
  if (i >= paras.length - 5) {
    console.log(
      `p[${i}] len=${text.length} drawing=${hasDrawing} snippet=${text.slice(0, 60)}`,
    );
  }
}
console.log("empty paragraphs in last 15:", emptyNearEnd);

// headers
const rels = zip.file("word/_rels/document.xml.rels")?.asText() ?? "";
console.log("\nrels with header:", (rels.match(/header/gi) || []).length);

// Try render with sample data
const Docxtemplater = (await import("docxtemplater")).default;
const data = {
  nome_cliente: "Augusto (ADMIN)",
  profissao: "teste",
  cpf: "000.000.000-00",
  rg: "123",
  data_nascimento: "01/01/1990",
  endereco: "Rua X",
  telefone: "11999999999",
  produtos_lista:
    "• Produto 1: iPhone 13...\n• Produto 2: iPhone 14...",
  produtos_qtd: "2",
  valor_total: "R$ 5.000,00",
  valor_total_extenso: "cinco mil reais",
  num_parcelas: "12",
  valor_parcela: "R$ 416,67",
  valor_parcela_extenso: "quatrocentos e dezesseis reais",
  primeiro_vencimento: "10/05/2026",
  numero_contrato: "44-2028",
  data_local_assinatura: "[Goiânia GO], 1 de maio de 2026",
  nome_cliente_assinatura: "Augusto (ADMIN)",
};

const doc = new Docxtemplater(new PizZip(fs.readFileSync(path)), {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
const out = doc.getZip().generate({ type: "nodebuffer" });
fs.writeFileSync("_test_contrato_out.docx", out);
const outXml = new PizZip(out).file("word/document.xml").asText();
console.log("\n=== AFTER RENDER ===");
console.log("page breaks:", (outXml.match(/w:type="page"/g) || []).length);
console.log("lastRenderedPageBreak:", (outXml.match(/w:lastRenderedPageBreak/g) || []).length);
console.log("sectPr:", (outXml.match(/<w:sectPr/g) || []).length);
console.log("wrote _test_contrato_out.docx");
