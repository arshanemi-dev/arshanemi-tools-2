'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'

// Colors come from CSS vars so they adapt to dark/light mode
const TYPE_META = {
  new_master: { label: 'New Master SKU', color: 'var(--lt-success)',     bg: 'var(--lt-success-bg)',  border: 'var(--lt-success)'  },
  new_sku:    { label: 'New SKU',        color: 'var(--lt-info)',        bg: 'var(--lt-info-bg)',     border: 'var(--lt-info)'     },
  remap:      { label: 'Remapped',       color: 'var(--lt-danger-text)', bg: 'var(--lt-danger-bg)',   border: 'var(--lt-danger-text)' },
  unmap:      { label: 'Unmapped',       color: 'var(--lt-warning)',     bg: 'var(--lt-warning-bg)',  border: 'var(--lt-warning)'  },
}

export default function SKUUploadDiffModal({ open, onClose, changes, onSubmit }) {
  const [decisions, setDecisions] = useState(() =>
    Object.fromEntries(changes.map(c => [c.id, true]))
  )

  const yesCount = Object.values(decisions).filter(Boolean).length

  function setAll(val) {
    setDecisions(Object.fromEntries(changes.map(c => [c.id, val])))
  }

  const ORDER   = ['new_master', 'new_sku', 'remap', 'unmap']
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
            const meta  = TYPE_META[type]
            const count = changes.filter(c => c.type === type).length
            if (!count) return null
            return (
              <span key={type}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid color-mix(in srgb, ${meta.border} 50%, transparent)` }}>
                {meta.label} ({count})
              </span>
            )
          })}
        </div>

        {/* Bulk actions + counter */}
        <div className="flex items-center gap-2">
          <button onClick={() => setAll(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--lt-success)' }}>
            All Yes
          </button>
          <button onClick={() => setAll(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border"
                  style={{ backgroundColor: 'var(--lt-card)', color: 'var(--lt-text-primary)', borderColor: 'var(--lt-divider)' }}>
            All No
          </button>
          <span className="text-xs ml-auto font-medium text-[var(--lt-text-subtle)]">
            {yesCount} / {changes.length} will apply
          </span>
        </div>

        {/* Change rows */}
        <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5" style={{ maxHeight: 360 }}>
          {grouped.map(change => {
            const meta  = TYPE_META[change.type]
            const isYes = decisions[change.id] ?? true
            return (
              <div
                key={change.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: isYes ? meta.bg : 'var(--lt-card)',
                  border: `1px solid ${isYes ? `color-mix(in srgb, ${meta.border} 50%, transparent)` : 'var(--lt-divider)'}`,
                }}
              >
                {/* Type badge */}
                <span
                  className="text-xs font-bold shrink-0 px-2 py-0.5 rounded-full"
                  style={{
                    color:           meta.color,
                    backgroundColor: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                    opacity:         isYes ? 1 : 0.45,
                  }}
                >
                  {meta.label}
                </span>

                {/* Description */}
                <span
                  className="text-sm flex-1 font-mono"
                  style={{ color: 'var(--lt-text-muted)', opacity: isYes ? 1 : 0.4 }}
                >
                  {change.label}
                </span>

                {/* Yes / No pill toggle */}
                <div
                  className="flex items-center shrink-0 overflow-hidden rounded-lg border"
                  style={{ borderColor: 'var(--lt-divider)' }}
                >
                  <button
                    onClick={() => setDecisions(p => ({ ...p, [change.id]: true }))}
                    className="px-2.5 py-1 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: isYes ? 'var(--lt-success)' : 'var(--lt-card)',
                      color:           isYes ? '#fff' : 'var(--lt-text-subtle)',
                    }}
                  >
                    Yes
                  </button>
                  <div style={{ width: 1, backgroundColor: 'var(--lt-divider)', alignSelf: 'stretch' }} />
                  <button
                    onClick={() => setDecisions(p => ({ ...p, [change.id]: false }))}
                    className="px-2.5 py-1 text-xs font-semibold transition-colors"
                    style={{
                      backgroundColor: !isYes ? 'var(--lt-card-hover)' : 'var(--lt-card)',
                      color:           !isYes ? 'var(--lt-text-primary)' : 'var(--lt-text-subtle)',
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
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--lt-divider)' }}>
          <button onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border"
                  style={{ backgroundColor: 'var(--lt-card)', color: 'var(--lt-text-primary)', borderColor: 'var(--lt-divider)' }}>
            Cancel
          </button>
          <button onClick={() => onSubmit(decisions)} disabled={yesCount === 0}
                  className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--lt-accent)' }}>
            Apply {yesCount} Change{yesCount !== 1 ? 's' : ''}
          </button>
        </div>

      </div>
    </Modal>
  )
}
