import fs from "node:fs";
import PizZip from "pizzip";

function textLen(xml) {
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("")
    .length;
}

function analyze(path, label) {
  const xml = new PizZip(fs.readFileSync(path)).file("word/document.xml").asText();
  const body = xml.match(/<w:body>([\s\S]*)<\/w:body>/)?.[1] ?? "";

  // Split on paragraphs that contain sectPr (section break)
  const chunks = body.split(/(?=<w:p[^>]*>[\s\S]*?<w:sectPr)/);
  console.log(`\n=== ${label} (${path}) ===`);
  console.log("chunks (section breaks):", chunks.length);

  chunks.forEach((chunk, i) => {
    const tl = textLen(chunk);
    const shapes = (chunk.match(/v:shape/g) || []).length;
    const hasNextPage = chunk.includes('w:type="nextPage"');
    console.log(
      `  sec ${i}: text=${tl} shapes=${shapes} nextPage=${hasNextPage}`,
    );
  });

  const lastChunk = chunks[chunks.length - 1] ?? "";
  console.log("final sectPr only chunk text:", textLen(lastChunk));
}

analyze("api/_lib/templates/contrato.docx", "template");
if (fs.existsSync("_test_contrato_out.docx")) {
  analyze("_test_contrato_out.docx", "rendered test");
}
