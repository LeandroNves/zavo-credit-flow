import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const z = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"));
const d = new Docxtemplater(z, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
d.render({
  nome_cliente: "A",
  cpf: "1",
  produtos_lista: "x",
  valor_total: "1",
  valor_total_extenso: "u",
  num_parcelas: "1",
  valor_parcela: "1",
  valor_parcela_extenso: "u",
  primeiro_vencimento: "1",
  numero_contrato: "1",
  data_local_assinatura: "d",
  nome_cliente_assinatura: "A",
  profissao: "",
  rg: "",
  data_nascimento: "",
  endereco: "",
  telefone: "",
});
const before = d.getZip().file("word/document.xml").asText();
const after = sanitizeContratoDocumentXml(before);
console.log("len before", before.length, "after", after.length, "delta", after.length - before.length);
console.log("Group 38 before", before.includes("Group 38"));
console.log("Group 38 after", after.includes("Group 38"));
console.log("COMPRADOR after", after.includes("COMPRADOR(A)"));

function fixFooterLogoAnchors(xml) {
  return xml.replace(
    /(<wp:positionV relativeFrom=")paragraph("><wp:posOffset>)(\d{7,})(<\/wp:posOffset><\/wp:positionV>)([\s\S]*?name="Image 27")/g,
    '$1page"><wp:align>bottom</wp:align><wp:posOffset>200000</wp:posOffset></wp:positionV>$5',
  );
}
const broken = fixFooterLogoAnchors(before);
console.log("\nfooter-only fix:");
console.log("len delta", broken.length - before.length);
console.log("Group 38", broken.includes("Group 38"));
console.log("openR", (broken.match(/<w:r[\s>]/g) || []).length, "closeR", (broken.match(/<\/w:r>/g) || []).length);
