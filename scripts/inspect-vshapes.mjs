import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const PAGE_TWIPS = 16850;
const shapes = [...xml.matchAll(/<v:shape[^>]*style="([^"]*)"[^>]*>/g)];
console.log("v:shape count:", shapes.length);

for (let i = 0; i < shapes.length; i++) {
  const style = shapes[i][1];
  const topM = style.match(/top:(\d+)/);
  const top = topM ? Number(topM[1]) : 0;
  if (top > PAGE_TWIPS * 0.5) {
    const idM = shapes[i][0].match(/id="([^"]*)"/);
    console.log(`shape ${i} id=${idM?.[1]} top=${top} (${(top / PAGE_TWIPS).toFixed(2)} pg)`);
  }
}

// paragraphs at end with only v:shape
const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? "";
const tailParas = (body.match(/<w:p[\s\S]*?<\/w:p>/g) ?? []).slice(-8);
console.log("\nlast 8 paragraphs:");
for (const p of tailParas) {
  const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");
  const shapesN = (p.match(/v:shape/g) || []).length;
  const drawingN = (p.match(/w:drawing/g) || []).length;
  console.log(`  text=${JSON.stringify(t.slice(0, 40))} vshape=${shapesN} drawing=${drawingN}`);
}
