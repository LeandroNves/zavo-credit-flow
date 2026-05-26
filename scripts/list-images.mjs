import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

let pos = 0;
let n = 0;
while ((pos = xml.indexOf('name="Image 27"', pos)) >= 0) {
  n++;
  const ctx = xml.slice(pos - 400, pos + 600);
  const posV = ctx.match(/positionV[\s\S]*?<\/wp:positionV>/)?.[0] ?? "";
  const posH = ctx.match(/positionH[\s\S]*?<\/wp:positionH>/)?.[0] ?? "";
  const behind = ctx.includes('behindDoc="1"') ? "behind" : "front";
  console.log(`\nImage 27 #${n} at ${pos} (${behind})`);
  console.log("  H:", posH.replace(/\s+/g, " "));
  console.log("  V:", posV.replace(/\s+/g, " "));
  pos++;
}

// first page border breaks
pos = 0;
n = 0;
while ((pos = xml.indexOf("lastRenderedPageBreak", pos)) >= 0) {
  n++;
  const paraStart = xml.lastIndexOf("<w:p ", pos);
  const paraEnd = xml.indexOf("</w:p>", pos);
  const para = xml.slice(paraStart, paraEnd);
  const t = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("")
    .slice(0, 60);
  console.log(`\nbreak ${n} in para text: ${JSON.stringify(t)}`);
  pos++;
}
