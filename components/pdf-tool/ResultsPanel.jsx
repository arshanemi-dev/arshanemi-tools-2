'use client'

import { Eye, Download } from 'lucide-react'

export default function ResultsPanel({ onPreview, onDownload, downloading }) {
  return (
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
  )
}
