'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import PlatformTabs    from '@/components/pdf-tool/PlatformTabs'
import PDFUploadZone   from '@/components/pdf-tool/PDFUploadZone'
import SortOptions     from '@/components/pdf-tool/SortOptions'
import ResultsPanel    from '@/components/pdf-tool/ResultsPanel'
import SKUManagerPanel from '@/components/sku/SKUManagerPanel'
import ManualCropTool  from '@/components/pdf-tool/ManualCropTool'
import PDFPreviewModal from '@/components/pdf-tool/PDFPreviewModal'
import { getSkuMappings } from '@/lib/skuStore'

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk))
  }
  return btoa(binary)
}

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

  // Preview modal
  const [previewOpen,     setPreviewOpen]     = useState(false)
  const [previewBase64,   setPreviewBase64]   = useState(null)
  const [previewFilename, setPreviewFilename] = useState('')

  // Unique SKUs extracted from the processed PDF → feeds Unmap tab
  const [pdfSkus, setPdfSkus] = useState([])

  useEffect(() => {
    setPremium(localStorage.getItem('pdf-tool-premium') === 'true')
  }, [])

  async function handleFile(f) {
    setFile(f); setResult(null); setError(''); setPdfSkus([]); setPreviewBase64(null)
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
    setFile(null); setPdfBytes(null); setResult(null)
    setError(''); setPdfSkus([]); setPreviewBase64(null)
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

      // Unique SKUs for Unmap tab
      const skus = [...new Set((data.labelsSummary || []).map(l => l.sku).filter(Boolean))]
      setPdfSkus(skus)

      // Base64 for preview modal
      setPreviewBase64(data.sortedPdfBase64)
      setPreviewFilename(
        (file?.name?.replace(/\.pdf$/i, '') || 'sorted') + `_${sortMode || 'sku-group'}.pdf`
      )
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!previewBase64) return
    setDownloading(true)
    try {
      const bytes = Uint8Array.from(atob(previewBase64), c => c.charCodeAt(0))
      const blob  = new Blob([bytes], { type: 'application/pdf' })
      const url   = URL.createObjectURL(blob)
      const a     = Object.assign(document.createElement('a'), { href: url, download: previewFilename })
      a.click(); URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  // Called by ManualCropTool after crop is applied → open preview modal
  function handleCropComplete(bytes, filename) {
    setPreviewBase64(bytesToBase64(bytes))
    setPreviewFilename(filename)
    setPreviewOpen(true)
  }

  const isManual = platform === 'manual'

  return (
    <div className="min-h-full" style={{ backgroundColor: '#f9fafb' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Platform tabs */}
        <PlatformTabs active={platform} onChange={p => { setPlatform(p); setResult(null) }} />

        {/* Upload + Options — two columns */}
        <div className="flex flex-col md:flex-row gap-4 items-start">

          {/* LEFT: upload + crop/process + results */}
          <div className="flex flex-col gap-3 w-full md:w-[55%]">
            <PDFUploadZone file={file} onFile={handleFile} onRemove={handleRemove} />

            {isManual && pdfBytes && (
              <ManualCropTool
                pdfBytes={pdfBytes}
                filename={file?.name}
                onCropComplete={handleCropComplete}
              />
            )}

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                 style={{ color: '#dc2626', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                {error}
              </p>
            )}

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

            {result && !isManual && (
              <ResultsPanel result={result} onPreview={() => setPreviewOpen(true)} />
            )}
          </div>

          {/* RIGHT: sort options — visible for ALL tabs including Manual */}
          <div className="w-full md:w-[45%]">
            <SortOptions selected={sortMode} onChange={setSortMode} premium={premium} />
          </div>
        </div>

        {/* SKU Manager with Unmap tab */}
        <SKUManagerPanel pdfSkus={pdfSkus} />
      </div>

      {/* PDF Preview Modal */}
      {previewOpen && previewBase64 && (
        <PDFPreviewModal
          pdfBase64={previewBase64}
          filename={previewFilename}
          onClose={() => setPreviewOpen(false)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  )
}
