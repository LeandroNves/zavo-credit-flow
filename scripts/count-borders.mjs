import fs from "node:fs";
import PizZip from "pizzip";

const xml = new PizZip(fs.readFileSync("api/_lib/templates/contrato.docx"))
  .file("word/document.xml")
  .asText();

const fullPage = (xml.match(/cx="7562850" cy="10696575"/g) || []).length;
const breaks = (xml.match(/lastRenderedPageBreak/g) || []).length;
console.log("full page borders:", fullPage, "breaks:", breaks);

// positions of full page borders
let pos = 0;
let n = 0;
while ((pos = xml.indexOf('cx="7562850" cy="10696575"', pos)) >= 0) {
  n++;
  const before = xml.slice(Math.max(0, pos - 800), pos);
  const hasBreak = before.includes("lastRenderedPageBreak");
  console.log(`border ${n} hasBreakBefore=${hasBreak}`);
  pos++;
}
