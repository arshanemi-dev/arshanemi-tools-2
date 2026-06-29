'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import PlatformTabs   from '@/components/pdf-tool/PlatformTabs'
import PDFUploadZone  from '@/components/pdf-tool/PDFUploadZone'
import SortOptions    from '@/components/pdf-tool/SortOptions'
import ResultsPanel   from '@/components/pdf-tool/ResultsPanel'
import SKUManagerPanel from '@/components/sku/SKUManagerPanel'
import ManualCropTool from '@/components/pdf-tool/ManualCropTool'
import { getSkuMappings } from '@/lib/skuStore'

export default function PDFToolPage() {
  const [platform,    setPlatform]    = useState('meesho')
  const [file,        setFile]        = useState(null)
  const [pdfBytes,    setPdfBytes]    = useState(null)
  const [sortMode,    setSortMode]    = useState('')
  const [processing,  setProcessing]  = useState(false)
  const [result,      setResult]      = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [premium,     setPremium]     = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    setPremium(localStorage.getItem('pdf-tool-premium') === 'true')
  }, [])

  async function handleFile(f) {
    setFile(f); setResult(null); setError('')
    const buf = await f.arrayBuffer()
    setPdfBytes(new Uint8Array(buf))

    if (platform !== 'manual') {
      try {
        const { detectPlatform } = await import('@/lib/platformDetector')
        const preview = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, 4000))
        const detected = detectPlatform(preview)
        if (detected !== 'manual') setPlatform(detected)
      } catch { /* ignore */ }
    }
  }

  function handleRemove() {
    setFile(null); setPdfBytes(null); setResult(null); setError('')
  }

  async function handleProcess() {
    if (!file) return
    setProcessing(true); setError('')
    try {
      const skuMappings = await getSkuMappings()
      const formData    = new FormData()
      formData.append('file',        file)
      formData.append('sortMode',    sortMode || 'sku-group')
      formData.append('skuMappings', JSON.stringify(skuMappings))

      const res  = await fetch('/api/pdf/process', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Processing failed'); return }

      const prev = parseInt(localStorage.getItem('pdf-tool-processed-count') || '0', 10)
      localStorage.setItem('pdf-tool-processed-count', String(prev + 1))
      setResult(data)
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  async function handleDownload() {
    if (!result?.sortedPdfBase64) return
    setDownloading(true)
    try {
      const bytes = Uint8Array.from(atob(result.sortedPdfBase64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      const url   = URL.createObjectURL(blob)
      const a     = Object.assign(document.createElement('a'), {
        href: url,
        download: (file?.name?.replace('.pdf', '') || 'sorted') + `_${sortMode || 'sku-group'}.pdf`
      })
      a.click(); URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  function handleCropDownload(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
    a.click(); URL.revokeObjectURL(url)
  }

  const isManual = platform === 'manual'

  return (
    <div className="min-h-full" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Platform tabs */}
        <PlatformTabs active={platform} onChange={p => { setPlatform(p); setResult(null) }} />

        {/* ── Upload + Options two-column ── */}
        <div className="flex flex-col md:flex-row gap-4 items-start">

          {/* LEFT: upload zone + process button */}
          <div className="flex flex-col gap-3 w-full md:w-[55%]">
            <PDFUploadZone file={file} onFile={handleFile} onRemove={handleRemove} />

            {/* Manual crop canvas */}
            {isManual && pdfBytes && (
              <ManualCropTool
                pdfBytes={pdfBytes}
                filename={file?.name}
                onDownload={handleCropDownload}
              />
            )}

            {/* Error */}
            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}

            {/* Process PDF button (only for platform tabs, not manual) */}
            {!isManual && (
              <button
                onClick={handleProcess}
                disabled={!file || processing}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#7c3aed' }}
              >
                {processing
                  ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  : 'Process PDF'}
              </button>
            )}

            {/* Results */}
            {result && (
              <ResultsPanel result={result} onDownload={handleDownload} downloading={downloading} />
            )}
          </div>

          {/* RIGHT: sort options */}
          {!isManual && (
            <div className="w-full md:w-[45%]">
              <SortOptions selected={sortMode} onChange={setSortMode} premium={premium} />
            </div>
          )}
        </div>

        {/* SKU Manager */}
        <SKUManagerPanel />

      </div>
    </div>
  )
}
