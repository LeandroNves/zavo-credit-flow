import fs from "node:fs";
import PizZip from "pizzip";

const path = process.argv[2] ?? "api/_lib/templates/contrato.docx";
const xml = new PizZip(fs.readFileSync(path)).file("word/document.xml").asText();

let i = 0;
let n = 0;
while ((i = xml.indexOf("lastRenderedPageBreak", i)) >= 0) {
  n++;
  console.log(`--- break ${n} ---`);
  console.log(xml.slice(Math.max(0, i - 120), i + 200).replace(/></g, ">\n<"));
  i++;
}

// Trailing paragraphs after produtos (search CLÁUSULA 2 or valor_total)
const k = xml.indexOf("{valor_total}") || xml.indexOf("CLÁUSULA 2");
if (k >= 0) {
  console.log("\n--- after clause 1 area ---");
  const slice = xml.slice(k, k + 3000);
  const paras = slice.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
  console.log("paragraphs in next 3k:", paras.length);
  for (const p of paras.slice(0, 8)) {
    const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");
    console.log("  text:", JSON.stringify(t.slice(0, 80)), "numPr:", p.includes("numPr"));
  }
}

// Logo shapes - docPr name
for (const m of xml.matchAll(/descr="([^"]*)"/g)) {
  if (m[1].toLowerCase().includes("zavo") || m[1].includes("logo")) {
    console.log("descr:", m[1]);
  }
}
