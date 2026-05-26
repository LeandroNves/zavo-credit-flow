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

const rendered = doc.getZip().file("word/document.xml").asText();
const FULL_PAGE_BORDER = 'cx="7562850" cy="10696575"';

let keptFirst = false;
let removed = 0;
let badRuns = 0;

rendered.replace(/<w:r[\s\S]*?<\/w:r>/g, (run, offset) => {
  if (!run.includes(FULL_PAGE_BORDER)) return run;
  if ([...run.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").trim()) return run;
  if (!keptFirst) {
    keptFirst = true;
    return run;
  }
  removed++;
  // check if run looks truncated (no mc close)
  if (run.includes("<mc:AlternateContent") && !run.includes("</mc:AlternateContent>")) {
    badRuns++;
    console.log("TRUNCATED run at", offset, "len", run.length);
  }
  return "";
});

console.log({ removed, badRuns });

const sanitized = sanitizeContratoDocumentXml(rendered);
// find invalid XML chars or control chars
for (let i = 0; i < sanitized.length; i++) {
  const c = sanitized.charCodeAt(i);
  if (c < 9 || (c > 9 && c < 32 && c !== 10 && c !== 13)) {
    console.log("control char at", i, c);
    break;
  }
}

// duplicate positionV without open
const broken = sanitized.match(/<\/wp:positionV>\s*<\/wp:positionV>/g);
console.log("double close positionV", broken?.length ?? 0);

const broken2 = sanitized.match(/relativeFrom="page"><wp:align>bottom<\/wp:align><wp:posOffset>200000<\/wp:posOffset><\/wp:positionV><\/wp:posOffset>/);
console.log("broken footer fix", !!broken2);
