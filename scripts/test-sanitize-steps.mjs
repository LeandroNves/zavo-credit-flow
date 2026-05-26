import fs from "node:fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { execSync } from "node:child_process";

const tpl = "api/_lib/templates/contrato.docx";
const data = {
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
};

const zip = new PizZip(fs.readFileSync(tpl));
const doc = new Docxtemplater(zip, {
  paragraphLoop: false,
  linebreaks: true,
  delimiters: { start: "{", end: "}" },
  nullGetter: () => "",
});
doc.render(data);
let xml = doc.getZip().file("word/document.xml").asText();

const FULL_PAGE_BORDER = 'cx="7562850" cy="10696575"';

function extractText(f) {
  return [...f.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").trim();
}

function stripBorderFromRun(run) {
  return run
    .replace(/<w:lastRenderedPageBreak\s*\/>/g, "")
    .replace(/<mc:AlternateContent>[\s\S]*?<\/mc:AlternateContent>/g, (block) =>
      block.includes(FULL_PAGE_BORDER) ? "" : block,
    );
}

function stripDuplicateFullPageBorderRuns(x) {
  let kept = false;
  return x.replace(/<w:r[\s\S]*?<\/w:r>/g, (run) => {
    if (!run.includes(FULL_PAGE_BORDER)) return run;
    if (extractText(run).length > 0) return stripBorderFromRun(run);
    if (!kept) {
      kept = true;
      return stripBorderFromRun(run);
    }
    return "";
  });
}

function stripEmptyList(x) {
  const marker = "</w:p>";
  let prodIdx = x.indexOf("Produto 1:") || x.indexOf("Produto 1");
  if (prodIdx < 0) prodIdx = x.match(/Produto \d+:/)?.index ?? -1;
  if (prodIdx < 0) return x;
  const closeIdx = x.indexOf(marker, prodIdx);
  if (closeIdx < 0) return x;
  let tail = x.slice(closeIdx + marker.length);
  const head = x.slice(0, closeIdx + marker.length);
  let changed = true;
  while (changed) {
    changed = false;
    const m = tail.match(/^(\s*<w:p[\s\S]*?<\/w:p>)/);
    if (!m) break;
    const p = m[1];
    if (
      extractText(p).length === 0 &&
      (p.includes("<w:numPr") || p.includes('w:val="PargrafodaLista"'))
    ) {
      tail = tail.slice(p.length);
      changed = true;
    }
  }
  return head + tail;
}

function fixFooter(x) {
  return x.replace(/<wp:anchor[\s\S]*?<\/wp:anchor>/g, (anchor) => {
    if (!anchor.includes('name="Image 27"')) return anchor;
    return anchor.replace(
      /<wp:positionV relativeFrom="paragraph"><wp:posOffset>\d{7,}<\/wp:posOffset><\/wp:positionV>/,
      '<wp:positionV relativeFrom="page"><wp:align>bottom</wp:align><wp:posOffset>200000</wp:posOffset></wp:positionV>',
    );
  });
}

function validate(label, content) {
  fs.writeFileSync("_step.xml", content);
  const r = execSync("powershell -NoProfile -File scripts/test-sanitize-steps.ps1 -XmlPath _step.xml", {
    encoding: "utf8",
  });
  console.log(label, r.trim());
}

validate("0-rendered", xml);
xml = xml.replace(/<w:lastRenderedPageBreak\s*\/>/g, "");
validate("1-after-breaks", xml);
const x2 = stripDuplicateFullPageBorderRuns(xml);
validate("2-after-borders", x2);
const x3 = stripEmptyList(x2);
validate("3-after-list", x3);
validate("4-after-footer", fixFooter(x3));
