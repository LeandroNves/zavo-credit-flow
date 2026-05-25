import PizZip from "pizzip";

/** Junta vários .docx (mesmo modelo) em um único documento, na ordem. */
export function mergeDocxBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error("merge_docx_empty");
  }
  if (buffers.length === 1) return buffers[0]!;

  const firstZip = new PizZip(buffers[0]!);
  const firstXml = firstZip.file("word/document.xml")?.asText();
  if (!firstXml) throw new Error("merge_docx_missing_document");

  const bodyMatch = firstXml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/);
  if (!bodyMatch) throw new Error("merge_docx_invalid_body");

  const sectPrMatch = bodyMatch[1]!.match(/<w:sectPr[\s\S]*<\/w:sectPr>/);
  const sectPr = sectPrMatch?.[0] ?? "";
  const pageBreak =
    '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

  let inner = bodyMatch[1]!.replace(/<w:sectPr[\s\S]*<\/w:sectPr>/, "").trim();

  for (let i = 1; i < buffers.length; i++) {
    const zip = new PizZip(buffers[i]!);
    const xml = zip.file("word/document.xml")?.asText();
    if (!xml) throw new Error("merge_docx_missing_document");
    const m = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/);
    if (!m) throw new Error("merge_docx_invalid_body");
    let part = m[1]!.replace(/<w:sectPr[\s\S]*<\/w:sectPr>/, "").trim();
    inner += pageBreak + part;
  }

  const mergedXml = firstXml.replace(
    /<w:body[^>]*>[\s\S]*<\/w:body>/,
    `<w:body>${inner}${sectPr}</w:body>`,
  );
  firstZip.file("word/document.xml", mergedXml);
  return firstZip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;
}
