'use client'

import { useRef, useState } from 'react'
import { CloudUpload, X } from 'lucide-react'

function PdfIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.7802 25.9435V19.6158H25.9441M24.8895 22.7797H22.7802M9.07027 25.9435V19.6158M9.07027 19.6158H11.1795C12.0532 19.6158 12.7614 20.3241 12.7614 21.1978C12.7614 22.0715 12.0532 22.7797 11.1795 22.7797H9.07027V19.6158ZM10.5467 9.49154V15.8192M12.656 13.71L10.5467 15.8192L8.4375 13.71M20.0383 15.8192V7.38226M17.5072 25.9435H15.9253V19.6158H17.5072C18.6721 19.6158 19.6164 20.5602 19.6164 21.7251V23.8343C19.6164 24.9992 18.6721 25.9435 17.5072 25.9435Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7101 1.05461H3.16392C1.99904 1.05461 1.05469 1.99897 1.05469 3.16384V23.8343C1.05469 24.9991 1.99904 25.9435 3.16392 25.9435H5.27314M13.7101 1.05461V5.27307C13.7101 6.43794 14.6544 7.38229 15.8193 7.38229H20.0377L13.7101 1.05461Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function PDFUploadZone({ file, onFile, onRemove }) {
  const inputRef = useRef(null)
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
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed text-[var(--lt-accent)] bg-[var(--lt-accent-muted)]"
        style={{ borderColor: 'var(--lt-accent)' }}
      >
        <div className="shrink-0">
          <PdfIcon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-[var(--lt-text-primary)]">{file.name}</p>
          <p className="text-xs text-[var(--lt-text-subtle)]">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button onClick={onRemove} className="shrink-0 text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] transition-colors">
          <X size={15} />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10 px-6 rounded-xl cursor-pointer transition-colors"
      style={{
        backgroundColor: over ? 'color-mix(in srgb, var(--lt-accent) 12%, var(--lt-card))' : 'var(--lt-accent-muted)',
        border: `2px dashed ${over ? 'var(--lt-accent)' : 'var(--lt-accent-light)'}`,
        minHeight: 180,
      }}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center text-white"
        style={{ backgroundColor: 'var(--lt-accent)' }}
      >
        <PdfIcon size={28} />
      </div>

      <div className="text-center">
        <p className="text-base font-medium text-[var(--lt-text-primary)]">Drag &amp; drop</p>
        <p className="text-sm mt-0.5 text-[var(--lt-text-subtle)]">or</p>
      </div>

      <button
        type="button"
        onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--lt-success)' }}
      >
        <CloudUpload size={15} />
        Select PDF File
      </button>

      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleInput} />
    </div>
  )
}
