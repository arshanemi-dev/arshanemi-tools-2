'use client'

import { Eye, Download } from 'lucide-react'

export default function ResultsPanel({
  onPreview,
  onDownload,
  downloading,
  onCombinedDownload,
  showPicklist,
  showMasterPicklist,
}) {
  const pickMode     = showMasterPicklist ? 'master-pick-list' : 'pick-list'
  const pickLabel    = showMasterPicklist ? 'Master Pick List' : 'Pick List'
  const isPickActive = showPicklist || showMasterPicklist
  const isBusy       = downloading

  return (
    <div className="flex flex-col gap-2">

      {/* Preview */}
      <button
        onClick={onPreview}
        className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        style={{
          backgroundColor: 'var(--lt-accent-muted)',
          color: 'var(--lt-accent-light)',
          border: '1px solid color-mix(in srgb, var(--lt-accent) 40%, transparent)',
        }}
      >
        <Eye size={15} /> Preview PDF
      </button>

      {/* Download — single button, downloads both PDFs if pick list is selected */}
      <button
        onClick={() => isPickActive ? onCombinedDownload(pickMode) : onDownload()}
        disabled={isBusy}
        className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 hover:opacity-90"
        style={{ backgroundColor: 'var(--lt-accent)' }}
      >
        {isBusy ? (
          <>
            <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
            Downloading…
          </>
        ) : (
          <>
            <Download size={15} />
            {isPickActive ? `Download PDF + ${pickLabel}` : 'Download PDF'}
          </>
        )}
      </button>

    </div>
  )
}
