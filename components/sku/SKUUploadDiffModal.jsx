'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

const TYPE_META = {
  new_master: { label: 'New Master SKU', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  new_sku:    { label: 'New SKU',        color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  remap:      { label: 'Remapped',       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  unmap:      { label: 'Unmapped',       color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
}

export default function SKUUploadDiffModal({ open, onClose, changes, onSubmit }) {
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(changes.map(c => [c.id, true]))
  )

  const yesCount = Object.values(decisions).filter(Boolean).length

  function setAll(val) {
    setDecisions(Object.fromEntries(changes.map(c => [c.id, val])))
  }

  function handleSubmit() {
    onSubmit(decisions)
  }

  // Group by type for rendering order
  const ORDER = ['new_master', 'new_sku', 'remap', 'unmap']
  const grouped = ORDER.flatMap(type => changes.filter(c => c.type === type))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Upload Preview — ${changes.length} Change${changes.length !== 1 ? 's' : ''}`}
      size="xl"
    >
      <div className="flex flex-col gap-4">

        {/* Legend */}
        <div className="flex flex-wrap gap-2">
          {ORDER.map(type => {
            const meta = TYPE_META[type]
            const count = changes.filter(c => c.type === type).length
            if (!count) return null
            return (
              <span key={type}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}>
                {meta.label} ({count})
              </span>
            )
          })}
        </div>

        {/* Bulk actions + counter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAll(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white"
            style={{ backgroundColor: '#16a34a' }}
          >
            All Yes
          </button>
          <button
            onClick={() => setAll(false)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border"
            style={{ backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' }}
          >
            All No
          </button>
          <span className="text-xs ml-auto font-medium" style={{ color: '#9ca3af' }}>
            {yesCount} / {changes.length} will apply
          </span>
        </div>

        {/* Change rows */}
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: 360 }}>
          {grouped.map(change => {
            const meta = TYPE_META[change.type]
            const isYes = decisions[change.id] ?? true
            return (
              <div
                key={change.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isYes ? meta.bg : '#f9fafb',
                  border: `1px solid ${isYes ? meta.border : '#e5e7eb'}`,
                }}
              >
                {/* Type badge */}
                <span
                  className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                  style={{
                    color: meta.color,
                    backgroundColor: `${meta.color}18`,
                    opacity: isYes ? 1 : 0.45,
                  }}
                >
                  {meta.label}
                </span>

                {/* Description */}
                <span
                  className="text-sm flex-1 font-mono"
                  style={{ color: '#374151', opacity: isYes ? 1 : 0.4 }}
                >
                  {change.label}
                </span>

                {/* Yes / No pill toggle */}
                <div
                  className="flex items-center shrink-0 overflow-hidden rounded-lg border"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <button
                    onClick={() => setDecisions(p => ({ ...p, [change.id]: true }))}
                    className="px-2.5 py-1 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: isYes ? '#16a34a' : '#fff',
                      color: isYes ? '#fff' : '#9ca3af',
                    }}
                  >
                    Yes
                  </button>
                  <div style={{ width: 1, backgroundColor: '#e5e7eb', alignSelf: 'stretch' }} />
                  <button
                    onClick={() => setDecisions(p => ({ ...p, [change.id]: false }))}
                    className="px-2.5 py-1 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: !isYes ? '#374151' : '#fff',
                      color: !isYes ? '#fff' : '#9ca3af',
                    }}
                  >
                    No
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg border"
            style={{ backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={yesCount === 0}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-40"
            style={{ backgroundColor: '#7c3aed' }}
          >
            Apply {yesCount} Change{yesCount !== 1 ? 's' : ''}
          </button>
        </div>

      </div>
    </Modal>
  )
}
