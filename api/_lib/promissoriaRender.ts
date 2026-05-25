import { renderDocxBuffer } from "./generateDocument.js";
import { docxBufferToPdf } from "./docxToPdf.js";
import { mergeDocxBuffers } from "./mergeDocx.js";

export type PromissoriaPageVars = Record<string, string | boolean>;

export async function renderPromissoriasDocxMerged(
  pages: PromissoriaPageVars[],
): Promise<Buffer> {
  const bufs = pages.map((page) => renderDocxBuffer("promissoria", page));
  return mergeDocxBuffers(bufs);
}

export async function renderPromissoriasPdfMerged(
  pages: PromissoriaPageVars[],
): Promise<Buffer> {
  const docx = await renderPromissoriasDocxMerged(pages);
  return docxBufferToPdf(docx);
}
