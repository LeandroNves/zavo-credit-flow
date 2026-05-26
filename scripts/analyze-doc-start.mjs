import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const bodyStart = xml.indexOf("<w:body");
console.log(xml.slice(bodyStart, bodyStart + 4000).replace(/></g, ">\n<").slice(0, 3500));
