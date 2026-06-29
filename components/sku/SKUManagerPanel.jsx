'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Upload, Download, Minus, ChevronDown } from 'lucide-react'
import {
  getMasterSKUs, addMasterSKU, deleteMasterSKU,
  getSkuMappings, addSkuMapping, deleteSkuMapping,
} from '@/lib/skuStore'

export default function SKUManagerPanel({ pdfSkus = [] }) {
  const [activeTab,    setActiveTab]    = useState(0)
  const [masters,      setMasters]      = useState([])
  const [mappings,     setMappings]     = useState([])
  const [masterSearch, setMasterSearch] = useState('')
  const [mapSearch,    setMapSearch]    = useState('')
  const [addInput,     setAddInput]     = useState('')
  const [selMasters,   setSelMasters]   = useState([])
  const [mapTarget,    setMapTarget]    = useState('')
  const uploadRef = useRef(null)

  const reload = useCallback(async () => {
    setMasters(await getMasterSKUs())
    setMappings(await getSkuMappings())
  }, [])

  useEffect(() => { reload() }, [reload])

  const filteredMasters = masters.filter(m =>
    m.toLowerCase().includes(masterSearch.toLowerCase())
  )

  function childrenOf(masterSku) {
    return mappings.filter(mp =>
      mp.masterSku === masterSku &&
      (!mapSearch || mp.sku.toLowerCase().includes(mapSearch.toLowerCase()))
    )
  }

  function mappedMasterOf(sku) {
    return mappings.find(m => m.sku === sku)?.masterSku || null
  }

  async function handleAddSKU() {
    const val = addInput.trim().toUpperCase()
    if (!val) return
    await addMasterSKU(val); setAddInput(''); reload()
  }

  async function handleDeleteMaster(sku) {
    await deleteMasterSKU(sku)
    for (const m of mappings.filter(m => m.masterSku === sku)) await deleteSkuMapping(m.sku)
    reload()
  }

  async function handleDeleteMapping(sku) {
    await deleteSkuMapping(sku); reload()
  }

  async function handleUnmapSelected() {
    for (const masterSku of selMasters) {
      for (const c of mappings.filter(m => m.masterSku === masterSku)) await deleteSkuMapping(c.sku)
    }
    setSelMasters([]); reload()
  }

  function toggleSel(sku) {
    setSelMasters(p => p.includes(sku) ? p.filter(s => s !== sku) : [...p, sku])
  }

  async function handleMapPdfSku(pdfSku) {
    if (!mapTarget) return
    await addSkuMapping(pdfSku, mapTarget); reload()
  }

  async function handleUnmapPdfSku(pdfSku) {
    await deleteSkuMapping(pdfSku); reload()
  }

  function handleDownload() {
    const blob = new Blob(
      [JSON.stringify({ masterSkus: masters, skuMappings: mappings }, null, 2)],
      { type: 'application/json' }
    )
    const url = URL.createObjectURL(blob)
    const a   = Object.assign(document.createElement('a'), { href: url, download: 'sku-store.json' })
    a.click(); URL.revokeObjectURL(url)
  }

  function handleUploadFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data.masterSkus))  for (const s of data.masterSkus)  await addMasterSKU(s)
        if (Array.isArray(data.skuMappings)) for (const m of data.skuMappings) await addSkuMapping(m.sku, m.masterSku)
        reload()
      } catch { console.error('Invalid JSON') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  const unmapTabDisabled = pdfSkus.length === 0

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}>

      {/* ── Header with tabs ── */}
      <div className="flex items-end justify-between px-4 pt-4 border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex items-end gap-0">
          {['Master & Map SKU', 'Unmap'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => { if (i === 0 || !unmapTabDisabled) setActiveTab(i) }}
              disabled={i === 1 && unmapTabDisabled}
              className="px-1 mr-5 pb-3 text-base font-bold transition-colors border-b-2 -mb-px"
              style={{
                color:       activeTab === i ? '#111827' : '#9ca3af',
                borderColor: activeTab === i ? '#111827' : 'transparent',
                opacity:     (i === 1 && unmapTabDisabled) ? 0.45 : 1,
                cursor:      (i === 1 && unmapTabDisabled) ? 'not-allowed' : 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-3">
          <button
            onClick={() => uploadRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#16a34a' }}
          >
            <Upload size={12} /> Upload
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <Download size={12} /> Download
          </button>
          <input ref={uploadRef} type="file" accept=".json" className="hidden" onChange={handleUploadFile} />
        </div>
      </div>

      {/* ── Tab 0: Master & Map SKU ── */}
      {activeTab === 0 && (
        <>
          <div className="flex gap-2 px-4 py-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
              <input
                value={masterSearch} onChange={e => setMasterSearch(e.target.value)}
                placeholder="Master SKU"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              />
            </div>
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
              <input
                value={mapSearch} onChange={e => setMapSearch(e.target.value)}
                placeholder="Map SKU"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb' }}>
            {filteredMasters.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>
                No master SKUs yet — add one below
              </p>
            ) : filteredMasters.map(masterSku => {
              const children   = childrenOf(masterSku)
              const isSelected = selMasters.includes(masterSku)
              return (
                <div key={masterSku}>
                  <div
                    className="flex items-center gap-2.5 px-4 py-2.5"
                    style={{ backgroundColor: isSelected ? '#f3f0ff' : '#fff', borderBottom: '1px solid #f3f4f6' }}
                  >
                    <input
                      type="checkbox" checked={isSelected} onChange={() => toggleSel(masterSku)}
                      className="w-3.5 h-3.5" style={{ accentColor: '#7c3aed' }}
                    />
                    <button
                      onClick={() => handleDeleteMaster(masterSku)}
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                    >
                      <Minus size={10} strokeWidth={3} />
                    </button>
                    <span className="text-sm font-semibold flex-1" style={{ color: '#111827' }}>{masterSku}</span>
                  </div>
                  {children.map(({ sku }) => (
                    <div
                      key={sku}
                      className="flex items-center pr-4 py-2"
                      style={{ paddingLeft: 40, backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}
                    >
                      <div style={{ width: 16, borderLeft: '1.5px solid #d1d5db', height: 20, marginRight: 8, flexShrink: 0 }} />
                      <span className="text-sm flex-1" style={{ color: '#6b7280' }}>{sku}</span>
                      <button
                        onClick={() => handleDeleteMapping(sku)}
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                      >
                        <Minus size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>

          <div className="px-4 py-3 border-t flex flex-col gap-2" style={{ borderColor: '#e5e7eb' }}>
            {selMasters.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleUnmapSelected}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: '#7c3aed', backgroundColor: '#f3f0ff', border: '1px solid #ddd6fe' }}
                >
                  Unmap Selected ({selMasters.length})
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={addInput}
                onChange={e => setAddInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleAddSKU()}
                placeholder="Add New SKU"
                className="flex-1 px-4 py-2.5 text-sm rounded-lg outline-none font-mono"
                style={{ border: '1px solid #e5e7eb', color: '#374151', backgroundColor: '#fff' }}
              />
              <button
                onClick={handleAddSKU}
                className="px-4 py-2.5 text-sm font-semibold rounded-lg text-white"
                style={{ backgroundColor: '#7c3aed' }}
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Tab 1: Unmap ── */}
      {activeTab === 1 && (
        <>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#e5e7eb' }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
              Select master SKU to map to:
            </p>
            <div className="relative">
              <select
                value={mapTarget}
                onChange={e => setMapTarget(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg outline-none appearance-none"
                style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
              >
                <option value="">— Choose master SKU —</option>
                {masters.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                           style={{ color: '#6b7280' }} />
            </div>
          </div>

          <div>
            {pdfSkus.length === 0 ? (
              <p className="text-sm text-center py-10" style={{ color: '#9ca3af' }}>
                Process a PDF first to see extracted SKUs here
              </p>
            ) : pdfSkus.map(sku => {
              const currentMaster = mappedMasterOf(sku)
              return (
                <div
                  key={sku}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid #f3f4f6' }}
                >
                  <span className="text-sm font-mono font-semibold flex-1" style={{ color: '#111827' }}>
                    {sku}
                  </span>
                  {currentMaster ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ color: '#7c3aed', backgroundColor: '#f3f0ff', border: '1px solid #ddd6fe' }}>
                        → {currentMaster}
                      </span>
                      <button
                        onClick={() => handleUnmapPdfSku(sku)}
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                        style={{ color: '#dc2626', backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
                      >
                        Unmap
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMapPdfSku(sku)}
                      disabled={!mapTarget}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white shrink-0 transition-opacity disabled:opacity-40"
                      style={{ backgroundColor: '#7c3aed' }}
                    >
                      Map
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
