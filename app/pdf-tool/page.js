'use client'

import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import PlatformTabs    from '@/components/pdf-tool/PlatformTabs'
import PDFUploadZone   from '@/components/pdf-tool/PDFUploadZone'
import SortOptions     from '@/components/pdf-tool/SortOptions'
import ResultsPanel    from '@/components/pdf-tool/ResultsPanel'
import SKUManagerPanel from '@/components/sku/SKUManagerPanel'
import ManualCropTool  from '@/components/pdf-tool/ManualCropTool'
import PDFPreviewModal from '@/components/pdf-tool/PDFPreviewModal'
import { getSkuMappings } from '@/lib/skuStore'
import { applyCropToAllPages } from '@/lib/pdfCropper'

function dts() {
  const d = new Date(), p = n => String(n).padStart(2, '0')
  return `_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 8192
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.slice(i, i + chunk))
  return btoa(binary)
}

export default function PDFToolPage() {
  const [platform,        setPlatform]        = useState('manual')
  const [file,            setFile]            = useState(null)
  const [pdfBytes,        setPdfBytes]        = useState(null)
  const [sortMode,        setSortMode]        = useState('')   // top section selection
  const [masterSortMode,  setMasterSortMode]  = useState('')   // bottom (master) section selection
  const [processing,         setProcessing]         = useState(false)
  const [downloading,        setDownloading]        = useState(false)
  const [downloadingPicklist,setDownloadingPicklist] = useState(false)
  const [premium,            setPremium]            = useState(false)
  const [error,              setError]              = useState('')
  const [labelsSummary,      setLabelsSummary]      = useState([])

  // Preview modal
  const [previewOpen,    setPreviewOpen]    = useState(false)
  const [previewBase64,  setPreviewBase64]  = useState(null)
  const [previewFilename,setPreviewFilename]= useState('')

  // Unique SKUs extracted → feeds Unmap tab
  const [pdfSkus,    setPdfSkus]    = useState([])
  // True once the user has drawn a valid crop rectangle in manual mode
  const [cropReady,  setCropReady]  = useState(false)

  const manualCropRef = useRef(null)

  useEffect(() => {
    setPremium(localStorage.getItem('pdf-tool-premium') === 'true')
  }, [])

  async function handleFile(f) {
    setFile(f); setError(''); setPdfSkus([]); setPreviewBase64(null)
    const buf = await f.arrayBuffer()
    setPdfBytes(new Uint8Array(buf))

    if (platform !== 'manual') {
      try {
        const { detectPlatform } = await import('@/lib/platformDetector')
        const preview  = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, 4000))
        const detected = detectPlatform(preview)
        if (detected !== 'manual') setPlatform(detected)
      } catch { /* ignore */ }
    }
  }

  function handleRemove() {
    setFile(null); setPdfBytes(null)
    setError(''); setPdfSkus([]); setPreviewBase64(null); setCropReady(false)
  }

  // Unified process: sort via API → apply crop (manual only) → ready for Preview / Download
  async function handleProcess() {
    if (!file) return
    setProcessing(true); setError('')

    const cropInfo = platform === 'manual' ? manualCropRef.current?.getCropPixels?.() : null
    // Master sort takes priority; fall back to basic sort or default
    const effectiveSortMode = masterSortMode || sortMode || 'sku-group'

    try {
      const skuMappings = await getSkuMappings()
      const formData    = new FormData()
      formData.append('file',        file)
      formData.append('sortMode',    effectiveSortMode)
      formData.append('skuMappings', JSON.stringify(skuMappings))

      const res  = await fetch('/api/pdf/process', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Processing failed'); return }

      const prev = parseInt(localStorage.getItem('pdf-tool-processed-count') || '0', 10)
      localStorage.setItem('pdf-tool-processed-count', String(prev + 1))

      const summary = data.labelsSummary || []
      setLabelsSummary(summary)
      const skus = [...new Set(summary.map(l => l.sku).filter(Boolean))]
      setPdfSkus(skus)

      let finalBytes = Uint8Array.from(atob(data.sortedPdfBase64), c => c.charCodeAt(0))

      if (cropInfo) {
        finalBytes = await applyCropToAllPages(finalBytes, cropInfo.pixelCrop, cropInfo.dims)
      }

      setPreviewBase64(bytesToBase64(finalBytes))
      setPreviewFilename(
        (file?.name?.replace(/\.pdf$/i, '') || 'processed') + `_new${dts()}.pdf`
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
      Object.assign(document.createElement('a'), { href: url, download: previewFilename }).click()
      URL.revokeObjectURL(url)
    } finally { setDownloading(false) }
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 200)
  }

  async function handleCombinedDownload(mode) {
    setDownloading(true)
    setDownloadingPicklist(true)
    try {
      // Fetch pick list PDF first (async, while page is blocked by spinner)
      let pickBlob = null
      if (labelsSummary.length) {
        const skuMappings = await getSkuMappings()
        const res = await fetch('/api/pdf/picklist', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ labels: labelsSummary, mappings: skuMappings, mode }),
        })
        if (res.ok) pickBlob = await res.blob()
      }

      // Download sorted PDF
      if (previewBase64) {
        const bytes = Uint8Array.from(atob(previewBase64), c => c.charCodeAt(0))
        saveBlob(new Blob([bytes], { type: 'application/pdf' }), previewFilename)
      }

      // Download pick list PDF after brief gap so browser accepts both
      if (pickBlob) {
        await new Promise(r => setTimeout(r, 400))
        const base     = (file?.name?.replace(/\.pdf$/i, '') || 'orders')
        const suffix   = mode === 'master-pick-list' ? '_master_picklist' : '_picklist'
        const filename = `${base}${suffix}${dts()}.pdf`
        saveBlob(pickBlob, filename)
      }
    } finally {
      setDownloading(false)
      setDownloadingPicklist(false)
    }
  }

  const isManual = platform === 'manual'

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
      <div className="w-full mx-auto px-4 py-6 flex flex-row gap-5">
<div className="flex flex-col gap-6 w-full mx-auto">
        {/* Platform tabs */}
        <PlatformTabs active={platform} onChange={p => { setPlatform(p); setPreviewBase64(null); setCropReady(false) }} />

        {/* Upload + Options */}
        <div className="flex flex-col md:flex-row gap-4 items-start w-full">

          {/* LEFT: upload + crop + process + result buttons */}
          <div className="flex flex-col gap-3 w-full">
            <PDFUploadZone file={file} onFile={handleFile} onRemove={handleRemove} />

            {isManual && pdfBytes && (
              <ManualCropTool
                ref={manualCropRef}
                pdfBytes={pdfBytes}
                onCropChange={setCropReady}
              />
            )}

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                 style={{ color: 'var(--lt-danger-text)', backgroundColor: 'var(--lt-danger-bg)', border: '1px solid color-mix(in srgb, var(--lt-danger-text) 40%, transparent)' }}>
                {error}
              </p>
            )}

           
          </div>

          {/* RIGHT: two-section sort options */}
          <div className="w-1/3 flex flex-col gap-3">
            <SortOptions
              selectedTop={sortMode}
              onChangeTop={setSortMode}
              selectedBottom={masterSortMode}
              onChangeBottom={setMasterSortMode}
              premium={premium}
            />
             {/* Process button — requires a sort option + crop (manual only) */}
            {(() => {
              const sortSelected = !!(sortMode || masterSortMode)
              const canProcess   = !!file && sortSelected && (!isManual || cropReady) && !processing
              const hint = !file
                ? 'Upload a PDF first'
                : !sortSelected
                  ? 'Select at least one option on the right'
                  : isManual && !cropReady
                    ? 'Draw a crop area on the preview'
                    : ''
              return (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={handleProcess}
                    disabled={!canProcess}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: 'var(--lt-accent)' }}
                  >
                    {processing
                      ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                      : isManual ? 'Process & Crop PDF' : 'Process PDF'}
                  </button>
                  {hint && !processing && (
                    <p className="text-center text-xs text-[var(--lt-text-subtle)]">{hint}</p>
                  )}
                </div>
              )
            })()}

            {/* Preview + Download buttons — shown for ALL modes once processed */}
            {previewBase64 && (
              <ResultsPanel
                onPreview={() => setPreviewOpen(true)}
                onDownload={handleDownload}
                downloading={downloading || downloadingPicklist}
                onCombinedDownload={handleCombinedDownload}
                showPicklist={masterSortMode === 'pick-list'}
                showMasterPicklist={masterSortMode === 'master-pick-list'}
              />
            )}
          </div>
        </div>
        </div>

        {/* SKU Manager */}
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
