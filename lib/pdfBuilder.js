import { PDFDocument } from 'pdf-lib'

/**
 * Rebuilds a PDF with pages reordered according to sortedPageIndexes.
 * Returns the new PDF as a Uint8Array.
 */
export async function buildSortedPdf(originalBytes, sortedPageIndexes) {
  const srcDoc  = await PDFDocument.load(originalBytes)
  const newDoc  = await PDFDocument.create()

  const pages   = await newDoc.copyPages(srcDoc, sortedPageIndexes)
  pages.forEach(p => newDoc.addPage(p))

  return newDoc.save()
}
