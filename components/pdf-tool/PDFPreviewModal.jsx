'use client'

import { useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'

export default function PDFPreviewModal({ pdfBase64, filename, onClose, onDownload, downloading }) {
  const [objectUrl, setObjectUrl] = useState(null)

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
        style={{ backgroundColor: 'var(--lt-surface)', height: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
          style={{ borderColor: 'var(--lt-divider)' }}
        >
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-sm font-bold text-[var(--lt-text-primary)]">PDF Preview</p>
            {filename && (
              <p className="text-xs truncate text-[var(--lt-text-subtle)]">{filename}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-opacity disabled:opacity-60 hover:opacity-90"
              style={{ backgroundColor: 'var(--lt-accent)' }}
            >
              <Download size={13} />
              {downloading ? 'Preparing…' : 'Download PDF'}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
              style={{ color: 'var(--lt-text-subtle)', backgroundColor: 'var(--lt-card-hover)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PDF area */}
        <div className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
          {!objectUrl ? (
            <div className="flex items-center justify-center h-full gap-3">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--lt-accent)' }} />
              <span className="text-sm text-[var(--lt-text-subtle)]">Preparing preview…</span>
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
