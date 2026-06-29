import { PDFDocument } from 'pdf-lib'

/**
 * Renders a single PDF page to a canvas element using pdfjs-dist.
 * Returns { pdfWidth, pdfHeight } in PDF points for coordinate mapping.
 */
export async function renderPageToCanvas(pdfBytes, pageIndex, canvas) {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
  const pdfDoc      = await loadingTask.promise
  const page        = await pdfDoc.getPage(pageIndex + 1)
  const viewport    = page.getViewport({ scale: 1.0 })

  // Scale to fit canvas display width
  const displayWidth = canvas.clientWidth || 600
  const scale        = displayWidth / viewport.width
  const scaled       = page.getViewport({ scale })

  canvas.width  = scaled.width
  canvas.height = scaled.height

  const ctx = canvas.getContext('2d')
  await page.render({ canvasContext: ctx, viewport: scaled }).promise

  await pdfDoc.destroy()

  return {
    pdfWidth:    viewport.width,
    pdfHeight:   viewport.height,
    canvasWidth:  scaled.width,
    canvasHeight: scaled.height,
    scale,
  }
}

/**
 * Applies the same CropBox to every page in the PDF.
 * cropBox is in canvas pixel coordinates; dims provides the scale info.
 */
export async function applyCropToAllPages(pdfBytes, pixelCropBox, dims) {
  const { pdfWidth, pdfHeight, canvasWidth, canvasHeight, scale } = dims

  // Convert canvas pixel coords → PDF point coords
  // PDF origin is bottom-left; canvas origin is top-left
  const pdfX      = (pixelCropBox.x      / canvasWidth)  * pdfWidth
  const pdfY      = ((canvasHeight - pixelCropBox.y - pixelCropBox.height) / canvasHeight) * pdfHeight
  const pdfW      = (pixelCropBox.width  / canvasWidth)  * pdfWidth
  const pdfH      = (pixelCropBox.height / canvasHeight) * pdfHeight

  const srcDoc = await PDFDocument.load(pdfBytes)
  const pages  = srcDoc.getPages()

  pages.forEach(page => {
    page.setCropBox(pdfX, pdfY, pdfW, pdfH)
  })

  return srcDoc.save()
}
