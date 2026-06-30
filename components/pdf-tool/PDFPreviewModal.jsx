'use client'

import { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'

export default function PDFPreviewModal({ pdfBase64, filename, onClose, onDownload, downloading }) {
  const [objectUrl, setObjectUrl] = useState(null)

  // Convert base64 → blob → object URL; revoke on unmount or base64 change
  useEffect(() => {
    if (!pdfBase64) return
    let url = null
    try {
      const bytes = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      url = URL.createObjectURL(blob)
      setObjectUrl(url)
    } catch (err) {
      console.error('PDF blob error:', err)
    }
    return () => {
      if (url) URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [pdfBase64])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: '#fff', height: '90vh' }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: '#e5e7eb' }}
        >
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

        {/* ── PDF area ── */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {!objectUrl ? (
            <div className="flex items-center justify-center h-full gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: '#7c3aed' }} />
              <span className="text-sm" style={{ color: '#6b7280' }}>Preparing preview…</span>
            </div>
          ) : (
            <iframe
              src={`${objectUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    </div>
  )
}
