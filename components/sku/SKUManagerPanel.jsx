'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'  // still used for upload parsing
import { Search, Upload, Download, ChevronDown, ChevronRight, Check, X, Trash2, Link2Off, Pencil } from 'lucide-react'
import {
  getMasterSKUs, addMasterSKU, deleteMasterSKU, updateMasterSKU,
  getSkuMappings, addSkuMapping, deleteSkuMapping,
} from '@/lib/skuStore'
import SKUUploadDiffModal from './SKUUploadDiffModal'

export default function SKUManagerPanel({ pdfSkus = [] }) {
  const [activeTab,    setActiveTab]    = useState(0)
  const [masters,      setMasters]      = useState([])
  const [mappings,     setMappings]     = useState([])
  const [masterSearch, setMasterSearch] = useState('')
  const [mapSearch,    setMapSearch]    = useState('')
  const [addInput,     setAddInput]     = useState('')
  const [collapsed,    setCollapsed]    = useState(new Set())
  const [renaming,     setRenaming]     = useState(null)        // { sku, value }
  const [selMasters,   setSelMasters]   = useState(new Set())   // selected master SKU strings (bulk delete/unmap)
  const [selChildren,  setSelChildren]  = useState(new Set())   // selected child SKU strings (bulk unmap children)

  // Unmap tab
  const [selPdfSkus,  setSelPdfSkus]  = useState([])
  const [mapTarget,   setMapTarget]   = useState('')
  const [unmapSearch, setUnmapSearch] = useState('')   // search text inside dropdown
  const [dropOpen,    setDropOpen]    = useState(false)
  const [skuSearch,   setSkuSearch]   = useState('')   // filter unmapped PDF SKU list
  const uploadRef   = useRef(null)
  const dropdownRef = useRef(null)

  // Upload diff modal
  const [diffOpen,    setDiffOpen]    = useState(false)
  const [diffChanges, setDiffChanges] = useState([])
  const [diffKey,     setDiffKey]     = useState(0)   // force modal remount per upload
  const [parsing,     setParsing]     = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState(null) // { text, ok }
  const [addError,    setAddError]    = useState('')

  const reload = useCallback(async () => {
    setMasters(await getMasterSKUs())
    setMappings(await getSkuMappings())
  }, [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    function onOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────────
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

  const unmappedPdfSkus = pdfSkus.filter(sku => !mappedMasterOf(sku))

  const visibleUnmappedSkus = unmappedPdfSkus.filter(sku =>
    sku.toLowerCase().includes(skuSearch.toLowerCase())
  )

  const filteredDropdownMasters = masters.filter(m =>
    m.toLowerCase().includes(unmapSearch.toLowerCase())
  )

  // ── Master selection helpers ───────────────────────────────────────────────────
  function toggleSelMaster(sku) {
    setSelMasters(prev => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku); else next.add(sku)
      return next
    })
  }
  function clearSelMasters() { setSelMasters(new Set()) }

  // ── Child selection helpers ───────────────────────────────────────────────────
  function toggleSelChild(sku) {
    setSelChildren(prev => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku); else next.add(sku)
      return next
    })
  }
  function clearSelChildren() { setSelChildren(new Set()) }

  // ── Collapse / expand ─────────────────────────────────────────────────────────
  function toggleCollapse(sku) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(sku)) next.delete(sku); else next.add(sku)
      return next
    })
  }

  // ── Master SKU actions ────────────────────────────────────────────────────────
  async function handleAddSKU() {
    const val = addInput.trim().toUpperCase()
    if (!val) return
    if (masters.includes(val)) {
      setAddError(`"${val}" already exists as a Master SKU`)
      return
    }
    setAddError('')
    await addMasterSKU(val); setAddInput(''); reload()
  }

  async function handleRenameSave() {
    if (!renaming) return
    const newVal = renaming.value.trim().toUpperCase()
    if (!newVal) return
    if (newVal !== renaming.sku && masters.includes(newVal)) {
      setRenaming(p => ({ ...p, error: `"${newVal}" already exists` }))
      return
    }
    if (newVal !== renaming.sku) {
      await updateMasterSKU(renaming.sku, newVal)
      for (const m of mappings.filter(m => m.masterSku === renaming.sku)) {
        await deleteSkuMapping(m.sku)
        await addSkuMapping(m.sku, newVal)
      }
    }
    setRenaming(null); reload()
  }

  async function handleDeleteMaster(sku) {
    await deleteMasterSKU(sku)
    for (const m of mappings.filter(m => m.masterSku === sku)) await deleteSkuMapping(m.sku)
    setCollapsed(prev => { const n = new Set(prev); n.delete(sku); return n })
    setSelMasters(prev => { const n = new Set(prev); n.delete(sku); return n })
    reload()
  }

  async function handleUnmapMaster(sku) {
    for (const m of mappings.filter(m => m.masterSku === sku)) await deleteSkuMapping(m.sku)
    reload()
  }

  async function handleDeleteMapping(sku) {
    setSelChildren(prev => { const n = new Set(prev); n.delete(sku); return n })
    await deleteSkuMapping(sku); reload()
  }

  async function handleBulkUnmapChildren() {
    for (const sku of selChildren) await deleteSkuMapping(sku)
    clearSelChildren(); reload()
  }

  // ── Master bulk actions ───────────────────────────────────────────────────────
  async function handleBulkDelete() {
    for (const sku of selMasters) await handleDeleteMaster(sku)
    clearSelMasters()
  }

  async function handleBulkUnmap() {
    for (const sku of selMasters) await handleUnmapMaster(sku)
    clearSelMasters()
  }

  // ── Unmap tab actions ─────────────────────────────────────────────────────────
  async function handleMapOne(sku) {
    if (!mapTarget) return
    await addSkuMapping(sku, mapTarget)
    setSelPdfSkus(p => p.filter(s => s !== sku))
    reload()
  }

  async function handleMapSelected() {
    if (!mapTarget || !selPdfSkus.length) return
    for (const sku of selPdfSkus) await addSkuMapping(sku, mapTarget)
    setSelPdfSkus([]); reload()
  }

  // ── Download Excel (via server route — ExcelJS with dropdown validation) ──────
  async function handleDownload() {
    const res = await fetch('/api/sku/export', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ masters, mappings, unmappedSkus: unmappedPdfSkus }),
    })
    if (!res.ok) { console.error('Export failed', await res.text()); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'sku-mapping.xlsx' }).click()
    URL.revokeObjectURL(url)
  }

  // ── Upload Excel → diff modal ─────────────────────────────────────────────────
  function handleUploadFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg(null)
    setParsing(true)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' })

        // Always look for the 'SKU Mapping' sheet by name; fall back to index 0
        const sheetName = wb.SheetNames.includes('SKU Mapping')
          ? 'SKU Mapping'
          : wb.SheetNames[0]
        const ws   = wb.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (!rows || rows.length < 2) {
          setParsing(false)
          setUploadMsg({ text: 'File is empty or has no data rows.', ok: false })
          return
        }

        const isEmpty = v => {
          const s = String(v ?? '').trim()
          return !s || s === '-' || s === '0'
        }

        const rawMapped   = []
        const rawUnmapped = []
        for (let i = 1; i < rows.length; i++) {
          const masterSku = String(rows[i][0] ?? '').trim()
          const sku       = String(rows[i][1] ?? '').trim()
          const unmapSku  = String(rows[i][2] ?? '').trim()

          if (!isEmpty(masterSku) && !isEmpty(sku)) rawMapped.push({ masterSku, sku })
          if (!isEmpty(unmapSku))                    rawUnmapped.push(unmapSku)
        }

        // ── Uniqueness checks ────────────────────────────────────────────────────
        // 1. Duplicate SKUs in mapped section (same SKU → different masters)
        const skuFirstSeen = new Map()
        const dupSkus      = new Set()
        for (const { sku, masterSku } of rawMapped) {
          if (skuFirstSeen.has(sku)) { dupSkus.add(sku) }
          else                       { skuFirstSeen.set(sku, masterSku) }
        }

        // 2. SKU appears in BOTH mapped and unmapped columns
        const mappedSkuSet = new Set(rawMapped.filter(r => !dupSkus.has(r.sku)).map(r => r.sku))
        const bothConflict = rawUnmapped.filter(sku => mappedSkuSet.has(sku))
        const bothSet      = new Set(bothConflict)

        // Build clean incoming sets
        const incoming = {
          mapped:   rawMapped.filter(r => !dupSkus.has(r.sku)),
          unmapped: rawUnmapped.filter(sku => !bothSet.has(sku)),
        }

        // Collect conflict warnings
        const conflictLines = []
        if (dupSkus.size > 0)      conflictLines.push(`Duplicate SKUs (skipped): ${[...dupSkus].join(', ')}`)
        if (bothConflict.length > 0) conflictLines.push(`SKU in both Mapped & UnMap (skipped): ${bothConflict.join(', ')}`)
        if (conflictLines.length > 0) {
          setUploadMsg({ text: conflictLines.join(' | '), ok: false })
        }

        const changes = []

        // New master SKUs (unique, not already in masters)
        const seenNewMasters = new Set()
        for (const { masterSku } of incoming.mapped) {
          if (!masters.includes(masterSku) && !seenNewMasters.has(masterSku)) {
            seenNewMasters.add(masterSku)
            changes.push({
              id:        `nm_${masterSku}`,
              type:      'new_master',
              masterSku,
              label:     masterSku,
            })
          }
        }

        // New SKUs and remapped SKUs
        for (const { masterSku, sku } of incoming.mapped) {
          const existing = mappings.find(m => m.sku === sku)
          if (!existing) {
            changes.push({
              id:        `ns_${sku}`,
              type:      'new_sku',
              sku,
              masterSku,
              label:     `${sku} → ${masterSku}`,
            })
          } else if (existing.masterSku !== masterSku) {
            changes.push({
              id:         `rm_${sku}`,
              type:       'remap',
              sku,
              fromMaster: existing.masterSku,
              toMaster:   masterSku,
              label:      `${sku}  (${existing.masterSku} → ${masterSku})`,
            })
          }
        }

        // Unmapped SKUs
        for (const sku of incoming.unmapped) {
          const existing = mappings.find(m => m.sku === sku)
          if (existing) {
            changes.push({
              id:         `um_${sku}`,
              type:       'unmap',
              sku,
              fromMaster: existing.masterSku,
              label:      `${sku}  (was → ${existing.masterSku})`,
            })
          }
        }

        setParsing(false)

        if (changes.length === 0) {
          // Only set "no changes" if we haven't already set a conflict warning
          if (conflictLines.length === 0) {
            setUploadMsg({ text: 'No changes detected — data matches current state.', ok: true })
          }
          return
        }

        setDiffChanges(changes)
        setDiffKey(k => k + 1)
        setDiffOpen(true)
      } catch (err) {
        console.error('Upload parse error', err)
        setParsing(false)
        setUploadMsg({ text: 'Failed to parse file. Make sure it is a valid .xlsx file.', ok: false })
      }
    }

    reader.onerror = () => {
      setParsing(false)
      setUploadMsg({ text: 'Could not read the file.', ok: false })
    }

    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  // ── Apply approved diff changes ───────────────────────────────────────────────
  async function handleApplyDiff(decisions) {
    const approved = diffChanges.filter(c => decisions[c.id])

    // Gather all master SKUs that need to exist (from new_master, new_sku, remap)
    const mastersNeeded = new Set(
      approved
        .map(c => c.masterSku ?? c.toMaster)
        .filter(Boolean)
    )
    const currentMasters = await getMasterSKUs()
    for (const m of mastersNeeded) {
      if (!currentMasters.includes(m)) await addMasterSKU(m)
    }

    for (const c of approved.filter(c => c.type === 'new_sku')) {
      await addSkuMapping(c.sku, c.masterSku)
    }
    for (const c of approved.filter(c => c.type === 'remap')) {
      await deleteSkuMapping(c.sku)
      await addSkuMapping(c.sku, c.toMaster)
    }
    for (const c of approved.filter(c => c.type === 'unmap')) {
      await deleteSkuMapping(c.sku)
    }

    setDiffOpen(false)
    setDiffChanges([])
    reload()
  }

  const unmapTabDisabled = pdfSkus.length === 0

  return (
    <>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}>

        {/* ── Header with tabs ── */}
        <div className="flex items-end justify-between px-4 pt-4 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-end">
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
              onClick={() => { setUploadMsg(null); uploadRef.current?.click() }}
              disabled={parsing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: '#16a34a' }}
            >
              {parsing ? (
                <>
                  <svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Processing…
                </>
              ) : (
                <><Upload size={12} /> Upload</>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: '#3b82f6' }}
            >
              <Download size={12} /> Download
            </button>
            <input
              ref={uploadRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleUploadFile}
            />
          </div>
        </div>

        {/* ── Upload feedback banner ── */}
        {uploadMsg && (
          <div
            className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold"
            style={{
              backgroundColor: uploadMsg.ok ? '#f0fdf4' : '#fef2f2',
              borderBottom: `1px solid ${uploadMsg.ok ? '#86efac' : '#fca5a5'}`,
              color: uploadMsg.ok ? '#16a34a' : '#dc2626',
            }}
          >
            <span>{uploadMsg.text}</span>
            <button onClick={() => setUploadMsg(null)} style={{ opacity: 0.6 }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Tab 0: Master & Map SKU ── */}
        {activeTab === 0 && (
          <>
            {/* Search row */}
            <div className="flex gap-2 px-4 py-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input value={masterSearch} onChange={e => setMasterSearch(e.target.value)}
                       placeholder="Master SKU"
                       className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                       style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }} />
              </div>
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input value={mapSearch} onChange={e => setMapSearch(e.target.value)}
                       placeholder="Map SKU"
                       className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                       style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }} />
              </div>
            </div>

            {/* Master bulk action bar */}
            {selMasters.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b"
                   style={{ backgroundColor: '#f3f0ff', borderColor: '#ddd6fe' }}>
                <span className="text-xs font-semibold flex-1" style={{ color: '#7c3aed' }}>
                  {selMasters.size} master{selMasters.size > 1 ? 's' : ''} selected
                </span>
                <button onClick={handleBulkUnmap}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
                        style={{ color: '#7c3aed', backgroundColor: '#ede9fe', border: '1px solid #c4b5fd' }}>
                  <Link2Off size={12} /> Unmap
                </button>
                <button onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ backgroundColor: '#dc2626' }}>
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={clearSelMasters}
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Child bulk action bar */}
            {selChildren.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b"
                   style={{ backgroundColor: '#fefce8', borderColor: '#fef08a' }}>
                <span className="text-xs font-semibold flex-1" style={{ color: '#92400e' }}>
                  {selChildren.size} child SKU{selChildren.size > 1 ? 's' : ''} selected
                </span>
                <button onClick={handleBulkUnmapChildren}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ backgroundColor: '#d97706' }}>
                  <Link2Off size={12} /> Unmap Selected
                </button>
                <button onClick={clearSelChildren}
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Tree list */}
            <div style={{ borderTop: '1px solid #e5e7eb', maxHeight: 340, overflowY: 'auto' }}>
              {filteredMasters.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>
                  No master SKUs yet — add one below
                </p>
              ) : filteredMasters.map(masterSku => {
                const children    = childrenOf(masterSku)
                const isCollapsed = collapsed.has(masterSku)
                const isRenaming  = renaming?.sku === masterSku
                const isSelected  = selMasters.has(masterSku)

                return (
                  <div key={masterSku}>
                    <div
                      className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none"
                      style={{
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: isSelected ? '#faf5ff' : isRenaming ? '#fafafa' : '#fff',
                      }}
                      onClick={e => {
                        const tag = e.target.tagName
                        if (tag === 'INPUT' || tag === 'BUTTON' || e.target.closest('button') || e.target.closest('input')) return
                        if (!isRenaming) toggleCollapse(masterSku)
                      }}
                    >
                      {!isRenaming && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelMaster(masterSku)}
                          onClick={e => e.stopPropagation()}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ accentColor: '#7c3aed' }}
                        />
                      )}

                      {!isRenaming && (
                        <span className="shrink-0" style={{ color: '#9ca3af' }}>
                          {isCollapsed
                            ? <ChevronRight size={14} />
                            : <ChevronDown size={14} />}
                        </span>
                      )}

                      {isRenaming ? (
                        <div className="flex flex-col flex-1 min-w-0 gap-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              value={renaming.value}
                              onChange={e => setRenaming(p => ({ ...p, value: e.target.value.toUpperCase(), error: '' }))}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(); if (e.key === 'Escape') setRenaming(null) }}
                              autoFocus
                              className="flex-1 min-w-0 px-2 py-1 text-sm font-mono rounded-lg outline-none"
                              style={{
                                border: `1px solid ${renaming.error ? '#fca5a5' : '#7c3aed'}`,
                                color: '#111827',
                                backgroundColor: renaming.error ? '#fef2f2' : '#fff',
                              }}
                            />
                            <button onClick={e => { e.stopPropagation(); handleRenameSave() }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: '#16a34a', color: '#fff' }}>
                              <Check size={11} strokeWidth={2.5} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setRenaming(null) }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                              <X size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                          {renaming.error && (
                            <p className="text-xs font-medium pl-1" style={{ color: '#dc2626' }}>
                              {renaming.error}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold flex-1 truncate uppercase" style={{ color: '#111827' }}>
                          {masterSku}
                          {children.length > 0 && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: '#9ca3af' }}>
                              ({children.length})
                            </span>
                          )}
                        </span>
                      )}

                      {!isRenaming && (
                        <button
                          onClick={e => { e.stopPropagation(); setRenaming({ sku: masterSku, value: masterSku }) }}
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: '#f3f0ff', color: '#7c3aed' }}
                          title="Rename"
                        >
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>

                    {!isCollapsed && children.map(({ sku }) => (
                      <div key={sku}
                           className="flex items-center gap-2 pr-4 py-2"
                           style={{ paddingLeft: 36, backgroundColor: '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                        <input
                          type="checkbox"
                          checked={selChildren.has(sku)}
                          onChange={() => toggleSelChild(sku)}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ accentColor: '#7c3aed' }}
                        />
                        <div style={{ width: 14, borderLeft: '1.5px solid #d1d5db', height: 20, flexShrink: 0 }} />
                        <span className="text-sm flex-1 font-mono" style={{ color: '#6b7280' }}>{sku}</span>
                        <button
                          onClick={() => handleDeleteMapping(sku)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                          style={{ color: '#7c3aed', backgroundColor: '#f3f0ff', border: '1px solid #ddd6fe' }}
                          title="Remove mapping"
                        >
                          <Link2Off size={10} /> Unmap
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Add new SKU */}
            <div className="px-4 py-3 border-t" style={{ borderColor: '#e5e7eb' }}>
              <div className="flex gap-2">
                <input
                  value={addInput}
                  onChange={e => { setAddInput(e.target.value.toUpperCase()); setAddError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAddSKU()}
                  placeholder="Add New Master SKU"
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg outline-none font-mono"
                  style={{
                    border: `1px solid ${addError ? '#fca5a5' : '#e5e7eb'}`,
                    color: '#374151',
                    backgroundColor: addError ? '#fef2f2' : '#fff',
                  }}
                />
                <button onClick={handleAddSKU}
                        className="px-4 py-2.5 text-sm font-semibold rounded-lg text-white"
                        style={{ backgroundColor: '#7c3aed' }}>
                  Add
                </button>
              </div>
              {addError && (
                <p className="mt-1.5 text-xs font-medium" style={{ color: '#dc2626' }}>
                  {addError}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Tab 1: Unmap ── */}
        {activeTab === 1 && (
          <>
            {/* Master SKU selector — searchable dropdown */}
            <div className="px-4 pt-3 pb-3 border-b" style={{ borderColor: '#e5e7eb' }}>
              <p className="text-xs font-semibold mb-1.5" style={{ color: '#374151' }}>
                Select master SKU to map to:
              </p>

              <div className="relative" ref={dropdownRef}>
                {/* Trigger / search input */}
                <div
                  className="flex items-center rounded-lg overflow-hidden"
                  style={{
                    border: `1px solid ${dropOpen ? '#7c3aed' : '#e5e7eb'}`,
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <Search size={13} className="ml-3 shrink-0" style={{ color: '#9ca3af' }} />
                  <input
                    value={dropOpen ? unmapSearch : mapTarget}
                    onChange={e => { setUnmapSearch(e.target.value); if (!dropOpen) setDropOpen(true) }}
                    onFocus={() => { setUnmapSearch(''); setDropOpen(true) }}
                    placeholder={mapTarget ? mapTarget : 'Search master SKU…'}
                    className="flex-1 px-2 py-2.5 text-sm outline-none bg-transparent font-mono"
                    style={{ color: dropOpen ? '#374151' : '#7c3aed', fontWeight: mapTarget && !dropOpen ? 600 : 400 }}
                  />
                  {mapTarget && !dropOpen && (
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { setMapTarget(''); setUnmapSearch(''); setSelPdfSkus([]) }}
                      className="px-2 shrink-0"
                      style={{ color: '#9ca3af' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                  <ChevronDown
                    size={14}
                    className="mr-3 shrink-0 transition-transform"
                    style={{ color: '#6b7280', transform: dropOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </div>

                {/* Dropdown list */}
                {dropOpen && (
                  <div
                    className="absolute z-20 w-full mt-1 rounded-lg overflow-y-auto shadow-lg"
                    style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', maxHeight: 200 }}
                  >
                    {filteredDropdownMasters.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: '#9ca3af' }}>
                        {unmapSearch ? `No match for "${unmapSearch}"` : 'No master SKUs yet'}
                      </p>
                    ) : filteredDropdownMasters.map((m, idx) => (
                      <button
                        key={m}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setMapTarget(m); setUnmapSearch(''); setDropOpen(false) }}
                        className="w-full text-left px-3 py-2.5 text-sm font-mono flex items-center gap-2"
                        style={{
                          backgroundColor: mapTarget === m ? '#f3f0ff' : 'transparent',
                          color:           mapTarget === m ? '#7c3aed' : '#374151',
                          fontWeight:      mapTarget === m ? 700 : 400,
                          borderBottom:    idx < filteredDropdownMasters.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}
                      >
                        {mapTarget === m && <Check size={12} strokeWidth={2.5} style={{ color: '#7c3aed', flexShrink: 0 }} />}
                        {mapTarget !== m && <span style={{ width: 12, flexShrink: 0 }} />}
                        {m}
                        <span className="ml-auto text-xs" style={{ color: '#9ca3af' }}>
                          {mappings.filter(mp => mp.masterSku === m).length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map batch button */}
              {selPdfSkus.length > 0 && mapTarget && (
                <button
                  onClick={handleMapSelected}
                  className="mt-2 w-full py-2 text-sm font-semibold rounded-lg text-white"
                  style={{ backgroundColor: '#7c3aed' }}
                >
                  Map {selPdfSkus.length} SKU{selPdfSkus.length > 1 ? 's' : ''} → {mapTarget}
                </button>
              )}
            </div>

            {unmappedPdfSkus.length > 0 && (
              <div className="px-4 py-2.5 border-b" style={{ borderColor: '#e5e7eb' }}>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                  <input
                    value={skuSearch}
                    onChange={e => setSkuSearch(e.target.value)}
                    placeholder="Filter SKUs…"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none font-mono"
                    style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}
                  />
                  {skuSearch && (
                    <button onClick={() => setSkuSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: '#9ca3af' }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {pdfSkus.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: '#9ca3af' }}>
                  Process a PDF first to see extracted SKUs here
                </p>
              ) : unmappedPdfSkus.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: '#16a34a' }}>
                  ✓ All PDF SKUs are mapped
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-4 py-2 border-b"
                       style={{ borderColor: '#f3f4f6', backgroundColor: '#f9fafb' }}>
                    <input
                      type="checkbox"
                      checked={visibleUnmappedSkus.length > 0 && visibleUnmappedSkus.every(s => selPdfSkus.includes(s))}
                      onChange={() => {
                        const allSel = visibleUnmappedSkus.every(s => selPdfSkus.includes(s))
                        if (allSel) setSelPdfSkus(p => p.filter(s => !visibleUnmappedSkus.includes(s)))
                        else        setSelPdfSkus(p => [...new Set([...p, ...visibleUnmappedSkus])])
                      }}
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ accentColor: '#7c3aed' }}
                    />
                    <span className="text-xs font-semibold flex-1" style={{ color: '#6b7280' }}>
                      {selPdfSkus.length > 0
                        ? `${selPdfSkus.length} of ${unmappedPdfSkus.length} selected`
                        : skuSearch
                          ? `${visibleUnmappedSkus.length} of ${unmappedPdfSkus.length} unmapped`
                          : `${unmappedPdfSkus.length} unmapped SKU${unmappedPdfSkus.length > 1 ? 's' : ''}`}
                    </span>
                  </div>

                  {visibleUnmappedSkus.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: '#9ca3af' }}>
                      No SKUs match "{skuSearch}"
                    </p>
                  ) : visibleUnmappedSkus.map(sku => (
                    <div key={sku}
                         className="flex items-center gap-3 px-4 py-3"
                         style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <input
                        type="checkbox"
                        checked={selPdfSkus.includes(sku)}
                        onChange={() => setSelPdfSkus(p => p.includes(sku) ? p.filter(s => s !== sku) : [...p, sku])}
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ accentColor: '#7c3aed' }}
                      />
                      <span className="text-sm font-mono font-semibold flex-1" style={{ color: '#111827' }}>
                        {sku}
                      </span>
                      <button
                        onClick={() => handleMapOne(sku)}
                        disabled={!mapTarget}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white shrink-0 transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: '#7c3aed' }}
                      >
                        Map
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload diff modal — keyed to force fresh state on each upload */}
      {diffChanges.length > 0 && (
        <SKUUploadDiffModal
          key={diffKey}
          open={diffOpen}
          onClose={() => setDiffOpen(false)}
          changes={diffChanges}
          onSubmit={handleApplyDiff}
        />
      )}
    </>
  )
}
