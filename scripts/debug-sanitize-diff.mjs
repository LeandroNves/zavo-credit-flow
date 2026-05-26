import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sanitizeContratoDocumentXml } from "../api/_lib/contratoDocxSanitize.ts";

const zip = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render({
  nome_cliente: "A",
  cpf: "1",
  produtos_lista: "• P1\n• P2",
  valor_total: "1",
  valor_total_extenso: "um",
  num_parcelas: "1",
  valor_parcela: "1",
  valor_parcela_extenso: "um",
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
const r = doc.getZip().file("word/document.xml").asText();
const s = sanitizeContratoDocumentXml(r);

function paraSig(xml, i) {
  const paras = (xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "").match(
    /<w:p[\s\S]*?<\/w:p>/g,
  ) ?? [];
  const p = paras[i];
  if (!p) return "MISSING";
  const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").slice(0, 50);
  return `${t} | border=${p.includes("7562850")} | p126ish=${p.includes("Image 27")}`;
}

for (let i = 118; i < 130; i++) {
  console.log(i, "R:", paraSig(r, i));
  console.log("   S:", paraSig(s, i));
}
