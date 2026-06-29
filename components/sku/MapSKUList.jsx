'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X, ArrowRight } from 'lucide-react'

export default function MapSKUList({ items, masters, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(null) // { sku, masterSku }

  if (!items.length) {
    return <p className="text-xs text-center py-4" style={{ color: 'var(--lt-text-subtle)' }}>No SKU mappings yet</p>
  }

  return items.map(({ sku, masterSku }) => (
    <div key={sku}
         className="flex items-center gap-2 px-3 py-2 rounded-lg"
         style={{ backgroundColor: 'var(--lt-bg-base)', border: '1px solid var(--lt-divider)' }}>
      {editing?.sku === sku ? (
        <>
          <span className="text-xs font-mono shrink-0" style={{ color: 'var(--lt-accent-light)' }}>{sku}</span>
          <ArrowRight size={11} style={{ color: 'var(--lt-text-subtle)', flexShrink: 0 }} />
          <select
            value={editing.masterSku}
            onChange={e => setEditing(p => ({ ...p, masterSku: e.target.value }))}
            autoFocus
            className="flex-1 px-2 py-0.5 text-xs rounded outline-none"
            style={{
              backgroundColor: 'var(--lt-card)',
              border: '1px solid var(--lt-accent)',
              color: 'var(--lt-text-primary)',
            }}
          >
            {masters.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={() => { onUpdate(sku, editing.masterSku); setEditing(null) }}
                  style={{ color: '#4ade80' }}><Check size={13} /></button>
          <button onClick={() => setEditing(null)}
                  style={{ color: 'var(--lt-text-subtle)' }}><X size={13} /></button>
        </>
      ) : (
        <>
          <span className="text-xs font-mono" style={{ color: 'var(--lt-accent-light)' }}>{sku}</span>
          <ArrowRight size={11} style={{ color: 'var(--lt-text-subtle)', flexShrink: 0 }} />
          <span className="flex-1 text-xs font-mono" style={{ color: 'var(--lt-text-muted)' }}>{masterSku}</span>
          <button onClick={() => setEditing({ sku, masterSku })}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--lt-text-subtle)' }}>
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(sku)}
                  className="p-1 rounded transition-colors"
                  style={{ color: '#f87171' }}>
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  ))
}
