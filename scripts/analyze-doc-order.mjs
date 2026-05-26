import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const markers = [
  "CONTRATO DE COMPRA",
  "{produtos_lista}",
  "CLÁUSULA 2",
  "CLÁUSULA 3",
  "lastRenderedPageBreak",
  "E, por estarem justas",
  "{data_local_assinatura}",
  "COMPRADOR(A)",
  "{nome_cliente_assinatura}",
];

const positions = markers
  .map((m) => ({ m, i: xml.indexOf(m) }))
  .filter((x) => x.i >= 0)
  .sort((a, b) => a.i - b.i);

console.log("Document order:");
for (const x of positions) {
  console.log(`  ${x.i.toString().padStart(7)}  ${x.m}`);
}

const breaks = [...xml.matchAll(/lastRenderedPageBreak/g)].map((m) => m.index);
console.log("\nPage breaks at:", breaks);

// paragraphs index for produtos and first break
const body = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? "";
const paras = body.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
for (let i = 0; i < paras.length; i++) {
  const p = paras[i];
  if (
    p.includes("{produtos_lista}") ||
    p.includes("lastRenderedPageBreak") ||
    p.includes("CLÁUSULA 2") ||
    p.includes("CLÁUSULA 3")
  ) {
    const t = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1])
      .join("")
      .slice(0, 50);
    console.log(
      `p[${i}] break=${p.includes("lastRenderedPageBreak")} draw=${p.includes("w:drawing")} t=${JSON.stringify(t)}`,
    );
  }
}
