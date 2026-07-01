'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Search, Upload, Download, ChevronRight, ChevronDown, Check, X, Trash2, Link2Off, Pencil } from 'lucide-react'
import {
  getMasterSKUs, addMasterSKU, deleteMasterSKU, updateMasterSKU,
  getSkuMappings, addSkuMapping, deleteSkuMapping,
} from '@/lib/skuStore'
import SKUUploadDiffModal from './SKUUploadDiffModal'

// ── Shared CSS var references ────────────────────────────────────────────────
const S = {
  surface:      'var(--lt-surface)',
  card:         'var(--lt-card)',
  cardHover:    'var(--lt-card-hover)',
  bgBase:       'var(--lt-bg-base)',
  divider:      'var(--lt-divider)',
  dividerLight: 'var(--lt-divider-light)',
  textPrimary:  'var(--lt-text-primary)',
  textMuted:    'var(--lt-text-muted)',
  textSubtle:   'var(--lt-text-subtle)',
  accent:       'var(--lt-accent)',
  accentLight:  'var(--lt-accent-light)',
  accentMuted:  'var(--lt-accent-muted)',
  success:      'var(--lt-success)',
  successBg:    'var(--lt-success-bg)',
  warning:      'var(--lt-warning)',
  warningBg:    'var(--lt-warning-bg)',
  danger:       'var(--lt-danger-text)',
  dangerBg:     'var(--lt-danger-bg)',
  info:         'var(--lt-info)',
  infoBg:       'var(--lt-info-bg)',
}

export default function SKUManagerPanel({ pdfSkus = [] }) {
  const [activeTab,    setActiveTab]    = useState(0)
  const [masters,      setMasters]      = useState([])
  const [mappings,     setMappings]     = useState([])
  const [masterSearch, setMasterSearch] = useState('')
  const [mapSearch,    setMapSearch]    = useState('')
  const [addInput,     setAddInput]     = useState('')
  const [collapsed,    setCollapsed]    = useState(new Set())
  const [renaming,     setRenaming]     = useState(null)
  const [selMasters,   setSelMasters]   = useState(new Set())
  const [selChildren,  setSelChildren]  = useState(new Set())

  const [selPdfSkus,  setSelPdfSkus]  = useState([])
  const [mapTarget,   setMapTarget]   = useState('')
  const [unmapSearch, setUnmapSearch] = useState('')
  const [skuSearch,   setSkuSearch]   = useState('')
  const uploadRef = useRef(null)

  const [diffOpen,    setDiffOpen]    = useState(false)
  const [diffChanges, setDiffChanges] = useState([])
  const [diffKey,     setDiffKey]     = useState(0)
  const [parsing,     setParsing]     = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState(null)
  const [addError,    setAddError]    = useState('')

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

  const unmappedPdfSkus    = pdfSkus.filter(sku => !mappedMasterOf(sku))
  const visibleUnmappedSkus = unmappedPdfSkus.filter(sku => sku.toLowerCase().includes(skuSearch.toLowerCase()))
  const filteredDropdownMasters = masters.filter(m => m.toLowerCase().includes(unmapSearch.toLowerCase()))

  function toggleSelMaster(sku) {
    setSelMasters(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n })
  }
  function clearSelMasters() { setSelMasters(new Set()) }

  function toggleSelChild(sku) {
    setSelChildren(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n })
  }
  function clearSelChildren() { setSelChildren(new Set()) }

  function toggleCollapse(sku) {
    setCollapsed(prev => { const n = new Set(prev); n.has(sku) ? n.delete(sku) : n.add(sku); return n })
  }

  async function handleAddSKU() {
    const val = addInput.trim().toUpperCase()
    if (!val) return
    if (masters.includes(val)) { setAddError(`"${val}" already exists as a Master SKU`); return }
    setAddError('')
    await addMasterSKU(val); setAddInput(''); reload()
  }

  async function handleRenameSave() {
    if (!renaming) return
    const newVal = renaming.value.trim().toUpperCase()
    if (!newVal) return
    if (newVal !== renaming.sku && masters.includes(newVal)) {
      setRenaming(p => ({ ...p, error: `"${newVal}" already exists` })); return
    }
    if (newVal !== renaming.sku) {
      await updateMasterSKU(renaming.sku, newVal)
      for (const m of mappings.filter(m => m.masterSku === renaming.sku)) {
        await deleteSkuMapping(m.sku); await addSkuMapping(m.sku, newVal)
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

  async function handleBulkDelete() {
    for (const sku of selMasters) await handleDeleteMaster(sku)
    clearSelMasters()
  }

  async function handleBulkUnmap() {
    for (const sku of selMasters) await handleUnmapMaster(sku)
    clearSelMasters()
  }

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

  async function handleDownload() {
    const res = await fetch('/api/sku/export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ masters, mappings, unmappedSkus: unmappedPdfSkus }),
    })
    if (!res.ok) { console.error('Export failed', await res.text()); return }
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const d = new Date(), p = n => String(n).padStart(2, '0')
    const stamp = `_${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    Object.assign(document.createElement('a'), { href: url, download: `sku-mapping${stamp}.xlsx` }).click()
    URL.revokeObjectURL(url)
  }

  function handleUploadFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadMsg(null); setParsing(true)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb   = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' })
        const sheetName = wb.SheetNames.includes('SKU Mapping') ? 'SKU Mapping' : wb.SheetNames[0]
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '' })

        if (!rows || rows.length < 2) {
          setParsing(false); setUploadMsg({ text: 'File is empty or has no data rows.', ok: false }); return
        }

        const isEmpty = v => { const s = String(v ?? '').trim(); return !s || s === '-' || s === '0' }
        const rawMapped = []; const rawUnmapped = []
        for (let i = 1; i < rows.length; i++) {
          const masterSku = String(rows[i][0] ?? '').trim()
          const sku       = String(rows[i][1] ?? '').trim()
          const unmapSku  = String(rows[i][2] ?? '').trim()
          if (!isEmpty(masterSku) && !isEmpty(sku)) rawMapped.push({ masterSku, sku })
          if (!isEmpty(unmapSku)) rawUnmapped.push(unmapSku)
        }

        const skuFirstSeen = new Map(); const dupSkus = new Set()
        for (const { sku, masterSku } of rawMapped) {
          skuFirstSeen.has(sku) ? dupSkus.add(sku) : skuFirstSeen.set(sku, masterSku)
        }

        const mappedSkuSet = new Set(rawMapped.filter(r => !dupSkus.has(r.sku)).map(r => r.sku))
        const bothConflict = rawUnmapped.filter(sku => mappedSkuSet.has(sku))
        const bothSet      = new Set(bothConflict)

        const incoming = {
          mapped:   rawMapped.filter(r => !dupSkus.has(r.sku)),
          unmapped: rawUnmapped.filter(sku => !bothSet.has(sku)),
        }

        const conflictLines = []
        if (dupSkus.size > 0)        conflictLines.push(`Duplicate SKUs (skipped): ${[...dupSkus].join(', ')}`)
        if (bothConflict.length > 0) conflictLines.push(`SKU in both Mapped & UnMap (skipped): ${bothConflict.join(', ')}`)
        if (conflictLines.length > 0) setUploadMsg({ text: conflictLines.join(' | '), ok: false })

        const changes = []
        const seenNewMasters = new Set()
        for (const { masterSku } of incoming.mapped) {
          if (!masters.includes(masterSku) && !seenNewMasters.has(masterSku)) {
            seenNewMasters.add(masterSku)
            changes.push({ id: `nm_${masterSku}`, type: 'new_master', masterSku, label: masterSku })
          }
        }
        for (const { masterSku, sku } of incoming.mapped) {
          const existing = mappings.find(m => m.sku === sku)
          if (!existing) {
            changes.push({ id: `ns_${sku}`, type: 'new_sku', sku, masterSku, label: `${sku} → ${masterSku}` })
          } else if (existing.masterSku !== masterSku) {
            changes.push({ id: `rm_${sku}`, type: 'remap', sku, fromMaster: existing.masterSku, toMaster: masterSku, label: `${sku}  (${existing.masterSku} → ${masterSku})` })
          }
        }
        for (const sku of incoming.unmapped) {
          const existing = mappings.find(m => m.sku === sku)
          if (existing) changes.push({ id: `um_${sku}`, type: 'unmap', sku, fromMaster: existing.masterSku, label: `${sku}  (was → ${existing.masterSku})` })
        }

        setParsing(false)
        if (changes.length === 0) {
          if (conflictLines.length === 0) setUploadMsg({ text: 'No changes detected — data matches current state.', ok: true })
          return
        }
        setDiffChanges(changes); setDiffKey(k => k + 1); setDiffOpen(true)
      } catch (err) {
        console.error('Upload parse error', err)
        setParsing(false)
        setUploadMsg({ text: 'Failed to parse file. Make sure it is a valid .xlsx file.', ok: false })
      }
    }
    reader.onerror = () => { setParsing(false); setUploadMsg({ text: 'Could not read the file.', ok: false }) }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function handleApplyDiff(decisions) {
    const approved = diffChanges.filter(c => decisions[c.id])
    const mastersNeeded = new Set(approved.map(c => c.masterSku ?? c.toMaster).filter(Boolean))
    const currentMasters = await getMasterSKUs()
    for (const m of mastersNeeded) { if (!currentMasters.includes(m)) await addMasterSKU(m) }
    for (const c of approved.filter(c => c.type === 'new_sku'))  await addSkuMapping(c.sku, c.masterSku)
    for (const c of approved.filter(c => c.type === 'remap'))    { await deleteSkuMapping(c.sku); await addSkuMapping(c.sku, c.toMaster) }
    for (const c of approved.filter(c => c.type === 'unmap'))    await deleteSkuMapping(c.sku)
    setDiffOpen(false); setDiffChanges([]); reload()
  }

  const unmapTabDisabled = pdfSkus.length === 0

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden w-3/5"
        style={{ borderColor: S.divider, backgroundColor: S.surface }}
      >
        {/* Header with tabs */}
        <div className="flex items-end justify-between px-4 pt-4 border-b" style={{ borderColor: S.divider }}>
          <div className="flex items-end">
            {['Master & Map SKU', 'Unmap'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { if (i === 0 || !unmapTabDisabled) setActiveTab(i) }}
                disabled={i === 1 && unmapTabDisabled}
                className="px-1 mr-5 pb-3 text-base font-bold transition-colors border-b-2 -mb-px"
                style={{
                  color:       activeTab === i ? S.textPrimary : S.textSubtle,
                  borderColor: activeTab === i ? S.accent : 'transparent',
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: S.success }}
            >
              {parsing ? (
                <><svg className="animate-spin" width={12} height={12} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" /></svg> Processing…</>
              ) : (
                <><Upload size={12} /> Upload</>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: S.info }}
            >
              <Download size={12} /> Download
            </button>
            <input ref={uploadRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUploadFile} />
          </div>
        </div>

        {/* Upload feedback banner */}
        {uploadMsg && (
          <div
            className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold"
            style={{
              backgroundColor: uploadMsg.ok ? S.successBg : S.dangerBg,
              borderBottom:    `1px solid ${uploadMsg.ok ? S.success : S.danger}`,
              color:           uploadMsg.ok ? S.success : S.danger,
            }}
          >
            <span>{uploadMsg.text}</span>
            <button onClick={() => setUploadMsg(null)} style={{ opacity: 0.6 }}><X size={13} /></button>
          </div>
        )}

        {/* Tab 0: Master & Map SKU */}
        {activeTab === 0 && (
          <>
            {/* Search row */}
            <div className="flex gap-2 px-4 py-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.textSubtle }} />
                <input value={masterSearch} onChange={e => setMasterSearch(e.target.value)} placeholder="Master SKU"
                       className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                       style={{ backgroundColor: S.bgBase, border: `1px solid ${S.divider}`, color: S.textPrimary }} />
              </div>
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.textSubtle }} />
                <input value={mapSearch} onChange={e => setMapSearch(e.target.value)} placeholder="Map SKU"
                       className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                       style={{ backgroundColor: S.bgBase, border: `1px solid ${S.divider}`, color: S.textPrimary }} />
              </div>
            </div>

            {/* Master bulk action bar */}
            {selMasters.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b"
                   style={{ backgroundColor: S.accentMuted, borderColor: `color-mix(in srgb, ${S.accent} 40%, transparent)` }}>
                <span className="text-xs font-semibold flex-1" style={{ color: S.accent }}>
                  {selMasters.size} master{selMasters.size > 1 ? 's' : ''} selected
                </span>
                <button onClick={handleBulkUnmap}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg"
                        style={{ color: S.accent, backgroundColor: S.accentMuted, border: `1px solid color-mix(in srgb, ${S.accent} 50%, transparent)` }}>
                  <Link2Off size={12} /> Unmap
                </button>
                <button onClick={handleBulkDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ backgroundColor: S.danger }}>
                  <Trash2 size={12} /> Delete
                </button>
                <button onClick={clearSelMasters}
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: S.cardHover, color: S.textSubtle }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Child bulk action bar */}
            {selChildren.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 border-b"
                   style={{ backgroundColor: S.warningBg, borderColor: `color-mix(in srgb, ${S.warning} 40%, transparent)` }}>
                <span className="text-xs font-semibold flex-1" style={{ color: S.warning }}>
                  {selChildren.size} child SKU{selChildren.size > 1 ? 's' : ''} selected
                </span>
                <button onClick={handleBulkUnmapChildren}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
                        style={{ backgroundColor: S.warning }}>
                  <Link2Off size={12} /> Unmap Selected
                </button>
                <button onClick={clearSelChildren}
                        className="w-6 h-6 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: S.cardHover, color: S.textSubtle }}>
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Tree list */}
            <div style={{ borderTop: `1px solid ${S.divider}`, maxHeight: 340, overflowY: 'auto' }}>
              {filteredMasters.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: S.textSubtle }}>No master SKUs yet — add one below</p>
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
                        borderBottom: `1px solid ${S.divider}`,
                        backgroundColor: isSelected ? S.accentMuted : isRenaming ? S.card : S.surface,
                      }}
                      onClick={e => {
                        const tag = e.target.tagName
                        if (tag === 'INPUT' || tag === 'BUTTON' || e.target.closest('button') || e.target.closest('input')) return
                        if (!isRenaming) toggleCollapse(masterSku)
                      }}
                    >
                      {!isRenaming && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelMaster(masterSku)}
                               onClick={e => e.stopPropagation()} className="w-3.5 h-3.5 shrink-0"
                               style={{ accentColor: S.accent }} />
                      )}

                      {!isRenaming && (
                        <span className="shrink-0" style={{ color: S.textSubtle }}>
                          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
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
                                border: `1px solid ${renaming.error ? S.danger : S.accent}`,
                                color: S.textPrimary,
                                backgroundColor: renaming.error ? S.dangerBg : S.bgBase,
                              }}
                            />
                            <button onClick={e => { e.stopPropagation(); handleRenameSave() }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: S.success, color: '#fff' }}>
                              <Check size={11} strokeWidth={2.5} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); setRenaming(null) }}
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: S.cardHover, color: S.textSubtle }}>
                              <X size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                          {renaming.error && (
                            <p className="text-xs font-medium pl-1" style={{ color: S.danger }}>{renaming.error}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold flex-1 truncate uppercase" style={{ color: S.textPrimary }}>
                          {masterSku}
                          {children.length > 0 && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: S.textSubtle }}>
                              ({children.length})
                            </span>
                          )}
                        </span>
                      )}

                      {!isRenaming && (
                        <button onClick={e => { e.stopPropagation(); setRenaming({ sku: masterSku, value: masterSku }) }}
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: S.accentMuted, color: S.accent }} title="Rename">
                          <Pencil size={11} />
                        </button>
                      )}
                    </div>

                    {!isCollapsed && children.map(({ sku }) => (
                      <div key={sku} className="flex items-center gap-2 pr-4 py-2"
                           style={{ paddingLeft: 36, backgroundColor: S.bgBase, borderBottom: `1px solid ${S.divider}` }}>
                        <input type="checkbox" checked={selChildren.has(sku)} onChange={() => toggleSelChild(sku)}
                               className="w-3.5 h-3.5 shrink-0" style={{ accentColor: S.accent }} />
                        <div style={{ width: 14, borderLeft: `1.5px solid ${S.dividerLight}`, height: 20, flexShrink: 0 }} />
                        <span className="text-sm flex-1 font-mono" style={{ color: S.textSubtle }}>{sku}</span>
                        <button onClick={() => handleDeleteMapping(sku)}
                                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0"
                                style={{ color: S.accent, backgroundColor: S.accentMuted, border: `1px solid color-mix(in srgb, ${S.accent} 40%, transparent)` }}
                                title="Remove mapping">
                          <Link2Off size={10} /> Unmap
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Add new SKU */}
            <div className="px-4 py-3 border-t" style={{ borderColor: S.divider }}>
              <div className="flex gap-2">
                <input
                  value={addInput}
                  onChange={e => { setAddInput(e.target.value.toUpperCase()); setAddError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAddSKU()}
                  placeholder="Add New Master SKU"
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg outline-none font-mono"
                  style={{
                    border: `1px solid ${addError ? S.danger : S.divider}`,
                    color: S.textPrimary,
                    backgroundColor: addError ? S.dangerBg : S.bgBase,
                  }}
                />
                <button onClick={handleAddSKU}
                        className="px-4 py-2.5 text-sm font-semibold rounded-lg text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: S.accent }}>
                  Add
                </button>
              </div>
              {addError && <p className="mt-1.5 text-xs font-medium" style={{ color: S.danger }}>{addError}</p>}
            </div>
          </>
        )}

        {/* Tab 1: Unmap */}
        {activeTab === 1 && (
          <div className="flex" style={{ borderTop: `1px solid ${S.divider}` }}>

            {/* LEFT: Unmapped SKUs */}
            <div className="flex flex-col" style={{ flex: 1, borderRight: `1px solid ${S.divider}` }}>
              <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.textSubtle }} />
                  <input value={skuSearch} onChange={e => setSkuSearch(e.target.value)} placeholder="Search SKU…"
                         className="w-full pl-8 pr-7 py-2 text-sm rounded-lg outline-none font-mono"
                         style={{ backgroundColor: S.bgBase, border: `1px solid ${S.divider}`, color: S.textPrimary }} />
                  {skuSearch && (
                    <button onClick={() => setSkuSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: S.textSubtle }}>
                      <X size={13} />
                    </button>
                  )}
                </div>

                {unmappedPdfSkus.length > 0 && (() => {
                  const allChecked  = visibleUnmappedSkus.length > 0 && visibleUnmappedSkus.every(s => selPdfSkus.includes(s))
                  const someChecked = visibleUnmappedSkus.some(s => selPdfSkus.includes(s)) && !allChecked
                  return (
                    <div className="flex items-center gap-2 px-1">
                      <input type="checkbox" checked={allChecked}
                             ref={el => { if (el) el.indeterminate = someChecked }}
                             onChange={() => {
                               if (allChecked) setSelPdfSkus(p => p.filter(s => !visibleUnmappedSkus.includes(s)))
                               else            setSelPdfSkus(p => [...new Set([...p, ...visibleUnmappedSkus])])
                             }}
                             className="w-3.5 h-3.5 shrink-0 cursor-pointer" style={{ accentColor: S.accent }} />
                      <span className="text-xs flex-1" style={{ color: S.textSubtle }}>
                        {selPdfSkus.length > 0
                          ? `${selPdfSkus.length} of ${unmappedPdfSkus.length} selected`
                          : `${unmappedPdfSkus.length} unmapped`}
                      </span>
                      <button onClick={handleMapSelected} disabled={selPdfSkus.length === 0 || !mapTarget}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0 transition-opacity disabled:opacity-35 hover:opacity-90"
                              style={{ backgroundColor: S.accent }}>
                        {selPdfSkus.length > 0 ? `Map ${selPdfSkus.length} →` : 'Map →'}
                      </button>
                    </div>
                  )
                })()}
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 300, borderTop: `1px solid ${S.divider}` }}>
                {pdfSkus.length === 0 ? (
                  <p className="text-xs text-center py-10" style={{ color: S.textSubtle }}>Process a PDF first</p>
                ) : unmappedPdfSkus.length === 0 ? (
                  <p className="text-xs text-center py-10" style={{ color: S.success }}>✓ All SKUs mapped</p>
                ) : visibleUnmappedSkus.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: S.textSubtle }}>No match for "{skuSearch}"</p>
                ) : visibleUnmappedSkus.map(sku => {
                  const isSel = selPdfSkus.includes(sku)
                  return (
                    <div key={sku} className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                         style={{ borderBottom: `1px solid ${S.divider}`, backgroundColor: isSel ? S.accentMuted : S.surface }}
                         onClick={() => setSelPdfSkus(p => p.includes(sku) ? p.filter(s => s !== sku) : [...p, sku])}>
                      <input type="checkbox" checked={isSel} onChange={() => {}} onClick={e => e.stopPropagation()}
                             className="w-3.5 h-3.5 shrink-0 cursor-pointer" style={{ accentColor: S.accent }} />
                      <span className="text-xs font-mono flex-1 truncate font-semibold" style={{ color: S.textPrimary }}>{sku}</span>
                      <button onClick={e => { e.stopPropagation(); handleMapOne(sku) }} disabled={!mapTarget}
                              className="px-2 py-0.5 rounded-md text-xs font-bold text-white shrink-0 disabled:opacity-30 transition-opacity hover:opacity-90"
                              style={{ backgroundColor: S.accent }}>
                        Map
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* RIGHT: Master SKUs */}
            <div className="flex flex-col" style={{ flex: 1 }}>
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.textSubtle }} />
                  <input value={unmapSearch} onChange={e => setUnmapSearch(e.target.value)} placeholder="Search Master SKU…"
                         className="w-full pl-8 pr-7 py-2 text-sm rounded-lg outline-none font-mono"
                         style={{ backgroundColor: S.bgBase, border: `1px solid ${S.divider}`, color: S.textPrimary }} />
                  {unmapSearch && (
                    <button onClick={() => setUnmapSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"
                            style={{ color: S.textSubtle }}>
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ overflowY: 'auto', maxHeight: 300, borderTop: `1px solid ${S.divider}` }}>
                {masters.length === 0 ? (
                  <p className="text-xs text-center py-10" style={{ color: S.textSubtle }}>No master SKUs yet</p>
                ) : filteredDropdownMasters.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: S.textSubtle }}>No match for "{unmapSearch}"</p>
                ) : filteredDropdownMasters.map(m => {
                  const isSel = mapTarget === m
                  return (
                    <label key={m} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
                           style={{ borderBottom: `1px solid ${S.divider}`, backgroundColor: isSel ? S.accentMuted : S.surface }}>
                      <input type="radio" name="unmap-master-target" value={m} checked={isSel}
                             onChange={() => setMapTarget(m)} onClick={() => { if (isSel) setMapTarget('') }}
                             className="w-3.5 h-3.5 shrink-0 cursor-pointer" style={{ accentColor: S.accent }} />
                      <span className="text-xs font-mono flex-1 truncate font-semibold"
                            style={{ color: isSel ? S.accent : S.textPrimary }}>
                        {m}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: S.textSubtle }}>
                        {mappings.filter(mp => mp.masterSku === m).length}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

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
