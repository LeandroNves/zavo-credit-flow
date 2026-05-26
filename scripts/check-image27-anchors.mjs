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
  produtos_lista: "• P1\n• P2",
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

const s = sanitizeContratoDocumentXml(d.getZip().file("word/document.xml").asText());
let n = 0;
for (const a of s.matchAll(/<wp:anchor[\s\S]*?<\/wp:anchor>/g)) {
  if (!a[0].includes('name="Image 27"')) continue;
  n++;
  const v = a[0].match(/<wp:positionV[\s\S]*?<\/wp:positionV>/)?.[0] ?? "";
  console.log(`Image27 anchor ${n}:`, v.replace(/\s+/g, " "));
}
console.log("3240405 left:", s.includes("3240405"));
