import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const break1 = xml.indexOf("lastRenderedPageBreak");
const slice = xml.slice(break1 - 500, break1 + 2500);
console.log(slice.replace(/></g, ">\n<").slice(0, 3500));
