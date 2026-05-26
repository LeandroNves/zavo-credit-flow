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
  produtos_lista: "• Produto 1: test\n• Produto 2: test2",
  valor_total: "R$ 5.000,00",
  valor_total_extenso: "cinco mil",
  num_parcelas: "12",
  valor_parcela: "R$ 416,67",
  valor_parcela_extenso: "quatrocentos",
  primeiro_vencimento: "10/05/2026",
  numero_contrato: "44-2028",
  data_local_assinatura: "[Goiânia GO], 26 de maio de 2026",
  nome_cliente_assinatura: "Augusto (ADMIN)",
};

function getParas(xml) {
  const body = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "";
  return body.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
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

for (const [label, xml] of [
  ["TEMPLATE", new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx")).file("word/document.xml").asText()],
  ["RENDERED", rendered],
  ["SANITIZED", sanitized],
]) {
  const paras = getParas(xml);
  console.log(`\n##### ${label} paras=${paras.length} #####`);
  for (let i = 118; i < paras.length; i++) {
    const t = [...paras[i].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join("");
    console.log(`\n--- p[${i}] len=${paras[i].length} text=${JSON.stringify(t.slice(0, 60))} ---`);
    if (i >= 122) {
      fs.writeFileSync(`_sig_${label}_p${i}.xml`, paras[i]);
      console.log(`  saved _sig_${label}_p${i}.xml`);
    }
  }
}

// Find all lastRenderedPageBreak positions in rendered
let pos = 0;
let n = 0;
while ((pos = rendered.indexOf("lastRenderedPageBreak", pos)) >= 0) {
  n++;
  const snippet = rendered.slice(Math.max(0, pos - 100), pos + 300);
  const nearSig = snippet.includes("COMPRADOR") || snippet.includes("VENDEDORA") || snippet.includes("assinatura");
  console.log(`\nbreak ${n} nearSig=${nearSig}`);
  console.log(snippet.replace(/></g, ">\n<").slice(0, 500));
  pos++;
}
