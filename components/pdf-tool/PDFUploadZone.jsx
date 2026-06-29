'use client'

import { useRef, useState } from 'react'
import { FileText, CloudUpload, X } from 'lucide-react'

export default function PDFUploadZone({ file, onFile, onRemove }) {
  const inputRef  = useRef(null)
  const [over, setOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault(); setOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f?.type === 'application/pdf') onFile(f)
  }
  function handleInput(e) {
    const f = e.target.files?.[0]
    if (f) onFile(f)
    e.target.value = ''
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
           style={{ backgroundColor: '#f3f0ff', borderColor: '#7c3aed', borderStyle: 'dashed' }}>
        <FileText size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{file.name}</p>
          <p className="text-xs" style={{ color: '#6b7280' }}>{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={onRemove} style={{ color: '#6b7280' }}><X size={15} /></button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl cursor-pointer"
      style={{
        backgroundColor: over ? '#ede9fe' : '#f3f0ff',
        border: `2px dashed ${over ? '#7c3aed' : '#a78bfa'}`,
        minHeight: 180,
      }}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      {/* PDF icon */}
      <div className="w-14 h-14 rounded-xl flex items-center justify-center"
           style={{ backgroundColor: '#ede9fe' }}>
        <FileText size={28} style={{ color: '#7c3aed' }} />
      </div>

      <div className="text-center">
        <p className="text-base font-medium" style={{ color: '#374151' }}>Drag &amp; drop</p>
        <p className="text-sm mt-0.5" style={{ color: '#9ca3af' }}>or</p>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: '#16a34a' }}
      >
        <CloudUpload size={15} />
        Select PDF File
      </button>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleInput} />
    </div>
  )
}
