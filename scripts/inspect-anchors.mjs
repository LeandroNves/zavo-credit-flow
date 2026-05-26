import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const anchors = [...xml.matchAll(/<wp:anchor[\s\S]*?<\/wp:anchor>/g)];
console.log("anchors:", anchors.length);

const PAGE_EMU = 10692000; // ~11.69in A4 height approx

for (let i = 0; i < anchors.length; i++) {
  const a = anchors[i][0];
  const posY = Number(
    a.match(/wp:positionV[\s\S]*?wp:posOffset>(\d+)/)?.[1] ?? 0,
  );
  const name = a.match(/descr="([^"]*)"/)?.[1] ?? "";
  if (posY > PAGE_EMU * 0.85 || i >= anchors.length - 5) {
    console.log(`anchor ${i}: Y=${posY} (${(posY / PAGE_EMU).toFixed(2)} pages) ${name}`);
  }
}
