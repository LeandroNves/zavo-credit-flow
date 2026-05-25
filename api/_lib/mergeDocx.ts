import PizZip from "pizzip";

/** Maior wp:docPr/@id no fragmento (Word exige IDs únicos no documento). */
function maxWpDocPrId(xml: string): number {
  let max = 0;
  for (const m of xml.matchAll(/<wp:docPr\b[^>]*\bid="(\d+)"/g)) {
    const n = Number(m[1]);
    if (n > max) max = n;
  }
  return max;
}

/** Renumera wp:docPr/@id a partir de `start` (inclusive). */
function renumberWpDocPrIds(xml: string, start: number): { xml: string; next: number } {
  let n = start;
  const out = xml.replace(
    /(<wp:docPr\b[^>]*\bid=")(\d+)(")/g,
    (_full, pre: string, _id: string, post: string) => {
      const replaced = `${pre}${n}${post}`;
      n += 1;
      return replaced;
    },
  );
  return { xml: out, next: n };
}

function extractBodyInner(xml: string): string {
  const bodyMatch = xml.match(/<w:body[^>]*>([\s\S]*)<\/w:body>/);
  if (!bodyMatch) throw new Error("merge_docx_invalid_body");
  return bodyMatch[1]!.replace(/<w:sectPr[\s\S]*<\/w:sectPr>/, "").trim();
}

/** Junta vários .docx (mesmo modelo) em um único documento, na ordem. */
export function mergeDocxBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error("merge_docx_empty");
  }
  if (buffers.length === 1) return buffers[0]!;

  const firstZip = new PizZip(buffers[0]!);
  const firstXml = firstZip.file("word/document.xml")?.asText();
  if (!firstXml) throw new Error("merge_docx_missing_document");

  const sectPrMatch = firstXml.match(/<w:body[^>]*>[\s\S]*?(<w:sectPr[\s\S]*<\/w:sectPr>)/);
  const sectPr = sectPrMatch?.[1] ?? "";
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

  let inner = extractBodyInner(firstXml);
  let nextDocPrId = maxWpDocPrId(inner) + 1;

  for (let i = 1; i < buffers.length; i++) {
    const zip = new PizZip(buffers[i]!);
    const xml = zip.file("word/document.xml")?.asText();
    if (!xml) throw new Error("merge_docx_missing_document");
    let part = extractBodyInner(xml);
    const renumbered = renumberWpDocPrIds(part, nextDocPrId);
    part = renumbered.xml;
    nextDocPrId = renumbered.next;
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
