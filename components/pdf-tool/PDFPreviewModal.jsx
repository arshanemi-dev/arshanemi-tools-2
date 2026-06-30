'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, Loader2, ZoomIn, ZoomOut } from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────────
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total])
  for (let d = -2; d <= 2; d++) {
    const p = current + d
    if (p > 1 && p < total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const n of sorted) {
    if (n - prev > 1) result.push('…')
    result.push(n)
    prev = n
  }
  return result
}

// ── per-page canvas — self-renders when pdfDoc / zoom changes ─────────────────
function PageCanvas({ pdfDoc, pageIndex, zoom }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let cancelled = false
    async function render() {
      try {
        const page     = await pdfDoc.getPage(pageIndex)
        if (cancelled || !canvasRef.current) return
        const canvas   = canvasRef.current
        const ctx      = canvas.getContext('2d')
        const vp       = page.getViewport({ scale: 1 })
        // base scale fits the modal width; zoom multiplies on top
        const containerW = canvas.parentElement?.offsetWidth || 560
        const scale      = (containerW / vp.width) * zoom
        const viewport   = page.getViewport({ scale })
        canvas.width     = viewport.width
        canvas.height    = viewport.height
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvasContext: ctx, viewport }).promise
      } catch (err) {
        if (!cancelled) console.error(`Page ${pageIndex} render error:`, err)
      }
    }
    render()
    return () => { cancelled = true }
  }, [pdfDoc, pageIndex, zoom])

  return <canvas ref={canvasRef} className="block" style={{ maxWidth: '100%' }} />
}

// ── modal ──────────────────────────────────────────────────────────────────────
export default function PDFPreviewModal({ pdfBase64, filename, onClose, onDownload, downloading }) {
  const pdfDocRef  = useRef(null)
  const scrollRef  = useRef(null)
  const [pdfDoc,    setPdfDoc]    = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [activePage,setActivePage]= useState(1)
  const [loading,   setLoading]   = useState(true)
  const [zoom,      setZoom]      = useState(1)

  // Load PDF
  useEffect(() => {
    if (!pdfBase64) return
    let cancelled = false
    setLoading(true); setPdfDoc(null); setPageCount(0); setActivePage(1); setZoom(1)

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
        setPdfDoc(doc); setPageCount(doc.numPages); setLoading(false)
      } catch (err) {
        console.error('PDF load error:', err)
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pdfBase64])

  // IntersectionObserver — keep active page pill in sync while scrolling
  useEffect(() => {
    if (!pageCount || loading || !scrollRef.current) return
    const root = scrollRef.current
    const observer = new IntersectionObserver(
      entries => {
        let best = null
        entries.forEach(e => {
          if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e
        })
        if (best) setActivePage(parseInt(best.target.dataset.page, 10))
      },
      { root, threshold: 0.3 }
    )
    root.querySelectorAll('[data-page]').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [pageCount, loading])

  function scrollToPage(n) {
    scrollRef.current?.querySelector(`[data-page="${n}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActivePage(n)
  }

  const zoomStep  = 0.25
  const zoomMin   = 0.5
  const zoomMax   = 2.5
  const zoomPct   = Math.round(zoom * 100)
  const pageRange = buildPageRange(activePage, pageCount)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fff', maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
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
              className="w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Toolbar: zoom + smart page selector ── */}
        {!loading && pageCount > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 border-b shrink-0"
            style={{ borderColor: '#e5e7eb', backgroundColor: '#fafafa' }}
          >
            {/* Zoom controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setZoom(z => Math.max(zoomMin, parseFloat((z - zoomStep).toFixed(2))))}
                disabled={zoom <= zoomMin}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span
                className="text-xs font-semibold min-w-[38px] text-center"
                style={{ color: '#7c3aed' }}
              >
                {zoomPct}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(zoomMax, parseFloat((z + zoomStep).toFixed(2))))}
                disabled={zoom >= zoomMax}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              {zoom !== 1 && (
                <button
                  onClick={() => setZoom(1)}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ color: '#7c3aed', backgroundColor: '#f3f0ff' }}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Divider */}
            {pageCount > 1 && (
              <div className="w-px self-stretch shrink-0" style={{ backgroundColor: '#e5e7eb' }} />
            )}

            {/* Smart page pills — scrollable */}
            {pageCount > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto flex-1">
                {pageRange.map((item, i) =>
                  item === '…' ? (
                    <span key={`ellipsis-${i}`} className="text-xs shrink-0 px-1"
                          style={{ color: '#9ca3af' }}>…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => scrollToPage(item)}
                      className="shrink-0 min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: activePage === item ? '#7c3aed' : '#f3f4f6',
                        color:           activePage === item ? '#fff'    : '#6b7280',
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            )}

            {/* Page counter */}
            <span className="text-xs shrink-0 ml-auto" style={{ color: '#9ca3af' }}>
              {activePage}/{pageCount}
            </span>
          </div>
        )}

        {/* ── Scrollable pages area ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-4 flex flex-col gap-4"
          style={{ backgroundColor: '#f3f4f6' }}
        >
          {loading ? (
            <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin" style={{ color: '#7c3aed' }} />
                <span className="text-sm" style={{ color: '#6b7280' }}>Loading PDF…</span>
              </div>
            </div>
          ) : (
            Array.from({ length: pageCount }, (_, i) => (
              <div
                key={i}
                data-page={i + 1}
                className="rounded-xl overflow-hidden shadow-sm bg-white flex flex-col items-center"
              >
                {/* Page label bar */}
                <div
                  className="w-full flex items-center justify-between px-3 py-1.5 shrink-0"
                  style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}
                >
                  <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>
                    Page {i + 1}
                  </span>
                  {pageCount > 1 && (
                    <span className="text-[10px]" style={{ color: '#d1d5db' }}>
                      {i + 1} / {pageCount}
                    </span>
                  )}
                </div>
                {/* Canvas — overflow visible so zoom > 1 shows full canvas */}
                <div className="overflow-auto w-full">
                  <PageCanvas pdfDoc={pdfDoc} pageIndex={i + 1} zoom={zoom} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
