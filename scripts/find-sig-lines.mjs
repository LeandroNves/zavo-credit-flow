import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();
const paras = (xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "").match(
  /<w:p[\s\S]*?<\/w:p>/g,
) ?? [];

for (let i = 115; i < paras.length; i++) {
  const p = paras[i];
  const lines =
    (p.match(/<a:lnTo>/g) || []).length +
    (p.match(/path="m,l/g) || []).length +
    (p.match(/Graphic 35/g) || []).length;
  const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("")
    .slice(0, 40);
  if (lines > 0 || p.includes("Image 27")) {
    console.log(`p[${i}] lines=${lines} Image27=${p.includes("Image 27")} text=${JSON.stringify(t)}`);
  }
}
