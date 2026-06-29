'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Upload, Download, Trash2, Pencil, Minus } from 'lucide-react'
import {
  getMasterSKUs, addMasterSKU, deleteMasterSKU, updateMasterSKU,
  getSkuMappings, addSkuMapping, deleteSkuMapping,
} from '@/lib/skuStore'

export default function SKUManagerPanel() {
  const [masters,       setMasters]       = useState([])
  const [mappings,      setMappings]      = useState([])
  const [masterSearch,  setMasterSearch]  = useState('')
  const [mapSearch,     setMapSearch]     = useState('')
  const [addInput,      setAddInput]      = useState('')
  const [selectedMasters, setSelected]   = useState([])   // checked master SKUs
  const uploadRef = useRef(null)

  const reload = useCallback(async () => {
    setMasters(await getMasterSKUs())
    setMappings(await getSkuMappings())
  }, [])

  useEffect(() => { reload() }, [reload])

  // ── Tree data ─────────────────────────────────────────────────────────────────
  // Filter masters by masterSearch, and filter children by mapSearch
  const filteredMasters = masters.filter(m =>
    m.toLowerCase().includes(masterSearch.toLowerCase())
  )

  function childrenOf(masterSku) {
    return mappings.filter(mp =>
      mp.masterSku === masterSku &&
      (!mapSearch || mp.sku.toLowerCase().includes(mapSearch.toLowerCase()))
    )
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function handleAddSKU() {
    const val = addInput.trim().toUpperCase()
    if (!val) return
    await addMasterSKU(val)
    setAddInput('')
    reload()
  }

  async function handleDeleteMaster(sku) {
    await deleteMasterSKU(sku)
    // also remove all mappings for this master
    const toDelete = mappings.filter(m => m.masterSku === sku)
    for (const m of toDelete) await deleteSkuMapping(m.sku)
    reload()
  }

  async function handleDeleteMapping(sku) {
    await deleteSkuMapping(sku)
    reload()
  }

  // ── Unmap selected ────────────────────────────────────────────────────────────
  async function handleUnmap() {
    for (const masterSku of selectedMasters) {
      const children = mappings.filter(m => m.masterSku === masterSku)
      for (const c of children) await deleteSkuMapping(c.sku)
    }
    setSelected([])
    reload()
  }

  function toggleSelect(sku) {
    setSelected(p => p.includes(sku) ? p.filter(s => s !== sku) : [...p, sku])
  }

  // ── Upload / Download ─────────────────────────────────────────────────────────
  function handleDownload() {
    const data = { masterSkus: masters, skuMappings: mappings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'sku-store.json' })
    a.click(); URL.revokeObjectURL(url)
  }

  function handleUploadFile(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data.masterSkus)) for (const s of data.masterSkus) await addMasterSKU(s)
        if (Array.isArray(data.skuMappings)) for (const m of data.skuMappings) await addSkuMapping(m.sku, m.masterSku)
        reload()
      } catch { console.error('Invalid JSON') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold" style={{ color: '#111827' }}>Master &amp; Map SKU</h2>
          {selectedMasters.length > 0 && (
            <button
              onClick={handleUnmap}
              className="text-sm font-semibold px-3 py-1 rounded-lg transition-colors"
              style={{ color: '#7c3aed', backgroundColor: '#f3f0ff' }}
            >
              Unmap
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {/* ── Search bars ── */}
      <div className="flex gap-2 px-4 pb-3">
        {/* Master SKU search */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            value={masterSearch}
            onChange={e => setMasterSearch(e.target.value)}
            placeholder="Mater SKU"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
          />
        </div>
        {/* Map SKU search + actions */}
        <div className="relative flex-1 flex items-center gap-1">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              value={mapSearch}
              onChange={e => setMapSearch(e.target.value)}
              placeholder="Map SKU"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
            />
          </div>
          <button className="p-2 rounded-lg" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            <Trash2 size={13} />
          </button>
          <button className="p-2 rounded-lg" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {/* ── Tree list ── */}
      <div className="border-t" style={{ borderColor: '#e5e7eb' }}>
        {filteredMasters.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>
            No master SKUs yet — add one below
          </p>
        ) : (
          filteredMasters.map(masterSku => {
            const children = childrenOf(masterSku)
            const isSelected = selectedMasters.includes(masterSku)
            return (
              <div key={masterSku}>
                {/* Parent row */}
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ backgroundColor: isSelected ? '#f3f0ff' : '#fff', borderBottom: '1px solid #f3f4f6' }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(masterSku)}
                    className="w-3.5 h-3.5"
                    style={{ accentColor: '#7c3aed' }}
                  />
                  {/* Purple minus circle */}
                  <button
                    onClick={() => handleDeleteMaster(masterSku)}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: '#7c3aed', color: '#fff' }}
                  >
                    <Minus size={10} strokeWidth={3} />
                  </button>
                  <span className="text-sm font-semibold flex-1" style={{ color: '#111827' }}>
                    {masterSku}
                  </span>
                </div>

                {/* Child rows */}
                {children.map(({ sku }) => (
                  <div
                    key={sku}
                    className="flex items-center pl-10 pr-4 py-2"
                    style={{ backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}
                  >
                    <div className="w-4 shrink-0" style={{ borderLeft: '1.5px solid #d1d5db', height: 20, marginRight: 8 }} />
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
          })
        )}
      </div>

      {/* ── Add New SKU ── */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex gap-2">
          <input
            type="text"
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

    </div>
  )
}
