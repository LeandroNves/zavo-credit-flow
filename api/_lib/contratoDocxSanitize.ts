import PizZip from "pizzip";

/**
 * Ajustes mínimos e seguros no OOXML do contrato após docxtemplater.
 *
 * Não alteramos molduras/desenhos do papel timbrado — regex em <w:r> quebra o XML
 * (Word não abre o arquivo). Layout do timbrado deve ser simplificado no .docx fonte.
 */

function extractText(fragment: string): string {
  return [...fragment.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("")
    .trim();
}

/** Remove quebras de página “fantasma” gravadas pelo Word no modelo. */
function stripLastRenderedPageBreaks(xml: string): string {
  return xml.replace(/<w:lastRenderedPageBreak\s*\/>/g, "");
}

/** Remove parágrafos vazios de lista logo após o bloco de produtos. */
function stripEmptyListParagraphsAfterProdutos(xml: string): string {
  const marker = "</w:p>";
  let prodIdx = xml.indexOf("{produtos_lista}");
  if (prodIdx < 0) {
    const m = xml.match(/Produto \d+:/);
    if (!m || m.index === undefined) return xml;
    prodIdx = m.index;
  }
  const closeIdx = xml.indexOf(marker, prodIdx);
  if (closeIdx < 0) return xml;

  let tail = xml.slice(closeIdx + marker.length);
  const head = xml.slice(0, closeIdx + marker.length);
  let changed = true;

  while (changed) {
    changed = false;
    const m = tail.match(/^(\s*<w:p[\s\S]*?<\/w:p>)/);
    if (!m) break;
    const p = m[1]!;
    const text = extractText(p);
    const isEmptyList =
      text.length === 0 &&
      (p.includes("<w:numPr") || p.includes('w:val="PargrafodaLista"'));
    if (isEmptyList) {
      tail = tail.slice(p.length);
      changed = true;
    }
  }

  return head + tail;
}

export function sanitizeContratoDocumentXml(xml: string): string {
  let out = stripLastRenderedPageBreaks(xml);
  out = stripEmptyListParagraphsAfterProdutos(out);
  return out;
}

export function sanitizeContratoDocxBuffer(docx: Buffer): Buffer {
  const zip = new PizZip(docx);
  const path = "word/document.xml";
  const file = zip.file(path);
  if (!file) return docx;
  const xml = sanitizeContratoDocumentXml(file.asText());
  zip.file(path, xml);
  return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
}
