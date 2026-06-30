'use client'

import { Eye, Download, ListOrdered } from 'lucide-react'

export default function ResultsPanel({
  onPreview,
  onDownload,
  downloading,
  onDownloadPicklist,
  downloadingPicklist,
  showPicklist,
  showMasterPicklist,
  hasLabels,
}) {
  const picklistMode   = showMasterPicklist ? 'master-pick-list' : 'pick-list'
  const showPickBtn    = (showPicklist || showMasterPicklist) && hasLabels
  const picklistLabel  = showMasterPicklist ? 'Master Pick List' : 'Pick List'

  return (
    <div className="flex flex-col gap-2">

      {/* Row 1 — Preview + Download sorted PDF */}
      <div className="flex gap-2">
        <button
          onClick={onPreview}
          className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: '#f3f0ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}
        >
          <Eye size={15} /> Preview PDF
        </button>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#7c3aed' }}
        >
          <Download size={15} />
          {downloading ? 'Preparing…' : 'Download PDF'}
        </button>
      </div>

      {/* Row 2 — Pick List PDF (only when pick-list / master-pick-list is selected) */}
      {showPickBtn && (
        <button
          onClick={() => onDownloadPicklist(picklistMode)}
          disabled={downloadingPicklist}
          className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
          style={{
            backgroundColor: '#f0fdf4',
            color:           '#16a34a',
            border:          '1px solid #86efac',
          }}
        >
          {downloadingPicklist ? (
            <>
              <svg className="animate-spin" width={15} height={15} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                        strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <ListOrdered size={15} />
              Download {picklistLabel} PDF
            </>
          )}
        </button>
      )}

    </div>
  )
}
