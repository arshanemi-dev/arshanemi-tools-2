'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'

export default function MasterSKUList({ items, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(null) // { sku, value }

  if (!items.length) {
    return <p className="text-xs text-center py-4" style={{ color: 'var(--lt-text-subtle)' }}>No master SKUs yet</p>
  }

  return items.map(sku => (
    <div key={sku}
         className="flex items-center gap-2 px-3 py-2 rounded-lg"
         style={{ backgroundColor: 'var(--lt-bg-base)', border: '1px solid var(--lt-divider)' }}>
      {editing?.sku === sku ? (
        <>
          <input
            value={editing.value}
            onChange={e => setEditing(p => ({ ...p, value: e.target.value.toUpperCase() }))}
            onKeyDown={e => {
              if (e.key === 'Enter') { onUpdate(sku, editing.value); setEditing(null) }
              if (e.key === 'Escape') setEditing(null)
            }}
            autoFocus
            className="flex-1 px-2 py-0.5 text-xs rounded font-mono outline-none"
            style={{
              backgroundColor: 'var(--lt-card)',
              border: '1px solid var(--lt-accent)',
              color: 'var(--lt-text-primary)',
            }}
          />
          <button onClick={() => { onUpdate(sku, editing.value); setEditing(null) }}
                  style={{ color: '#4ade80' }}><Check size={13} /></button>
          <button onClick={() => setEditing(null)}
                  style={{ color: 'var(--lt-text-subtle)' }}><X size={13} /></button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs font-mono" style={{ color: 'var(--lt-accent-light)' }}>{sku}</span>
          <button onClick={() => setEditing({ sku, value: sku })}
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
