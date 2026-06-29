'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function PDFPreviewModal({ pdfBase64, filename, onClose, onDownload, downloading }) {
  const canvasRef  = useRef(null)
  const pdfDocRef  = useRef(null)
  const [pageNum,   setPageNum]   = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const [docReady,  setDocReady]  = useState(false)
  const [rendering, setRendering] = useState(false)

  // Load PDF document
  useEffect(() => {
    if (!pdfBase64) return
    let cancelled = false
    setDocReady(false)
    async function load() {
      try {
        if (pdfDocRef.current) { await pdfDocRef.current.destroy(); pdfDocRef.current = null }
        const bytes    = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise
        if (cancelled) { doc.destroy(); return }
        pdfDocRef.current = doc
        setPageCount(doc.numPages)
        setPageNum(1)
        setDocReady(true)
      } catch (err) {
        console.error('PDF load error:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pdfBase64])

  // Render current page
  useEffect(() => {
    if (!docReady || !pdfDocRef.current || !canvasRef.current) return
    let cancelled = false
    async function render() {
      setRendering(true)
      try {
        const page       = await pdfDocRef.current.getPage(pageNum)
        const canvas     = canvasRef.current
        if (!canvas) return
        const ctx        = canvas.getContext('2d')
        const vp         = page.getViewport({ scale: 1 })
        const containerW = canvas.parentElement?.clientWidth || 560
        const scale      = Math.min(containerW / vp.width, 2)
        const viewport   = page.getViewport({ scale })
        canvas.width     = viewport.width
        canvas.height    = viewport.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: ctx, viewport }).promise
        if (!cancelled) setRendering(false)
      } catch (err) {
        console.error('Render error:', err)
        if (!cancelled) setRendering(false)
      }
    }
    render()
    return () => { cancelled = true }
  }, [pageNum, docReady])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fff', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
             style={{ borderColor: '#e5e7eb' }}>
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-sm font-bold" style={{ color: '#111827' }}>PDF Preview</p>
            {filename && (
              <p className="text-xs truncate" style={{ color: '#6b7280' }}>{filename}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#7c3aed' }}
            >
              <Download size={13} />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-4" style={{ backgroundColor: '#f3f4f6' }}>
          <div className="relative w-full rounded-lg overflow-hidden shadow bg-white">
            {(rendering || !docReady) && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80"
                   style={{ minHeight: 200 }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#7c3aed' }} />
              </div>
            )}
            <canvas ref={canvasRef} className="w-full block" />
          </div>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-4 px-5 py-3 border-t shrink-0"
               style={{ borderColor: '#e5e7eb' }}>
            <button
              onClick={() => setPageNum(p => Math.max(1, p - 1))}
              disabled={pageNum <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <ChevronLeft size={15} style={{ color: '#374151' }} />
            </button>
            <span className="text-sm" style={{ color: '#374151' }}>
              Page{' '}
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>{pageNum}</span>
              {' '}of {pageCount}
            </span>
            <button
              onClick={() => setPageNum(p => Math.min(pageCount, p + 1))}
              disabled={pageNum >= pageCount}
              className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <ChevronRight size={15} style={{ color: '#374151' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
