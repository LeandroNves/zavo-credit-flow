import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

let n = 0;
let kept = 0;
let removed = 0;
xml.replace(/<w:p[\s\S]*?<\/w:p>/g, (para) => {
  if (!para.includes('cx="7562850" cy="10696575"')) return para;
  n++;
  const text = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("")
    .trim();
  if (text.length > 0) {
    console.log(`border para ${n} HAS TEXT: ${JSON.stringify(text.slice(0, 40))}`);
  } else if (kept === 0) {
    kept++;
    console.log(`border para ${n} KEPT (first)`);
  } else {
    removed++;
    console.log(`border para ${n} WOULD REMOVE`);
  }
  return para;
});
console.log({ n, kept, removed });
