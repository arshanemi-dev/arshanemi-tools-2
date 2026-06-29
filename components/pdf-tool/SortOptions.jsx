'use client'

const FREE_OPTIONS = [
  { id: 'sku-group',        label: 'Sort by "SKU Group"'        },
  { id: 'pickup-partner',   label: 'Sort by "Pickup Partner"'   },
  { id: 'date',             label: 'Sort by "Date"'             },
  { id: 'company-wise',     label: 'Sort by "Company Wise"'     },
  { id: 'master-sku-group', label: 'Sort by "Master SKU Group"' },
]

const PREMIUM_OPTIONS = [
  { id: 'pick-list',        label: 'Pick List'       },
  { id: 'master-pick-list', label: 'Master Pick List' },
]

export default function SortOptions({ selected, onChange, premium }) {
  return (
    <div className="rounded-xl border overflow-hidden h-full"
         style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}>

      {/* Free section */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>Options</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            Free
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {FREE_OPTIONS.map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selected === opt.id}
                onChange={() => onChange(selected === opt.id ? '' : opt.id)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: '#7c3aed' }}
              />
              <span className="text-sm" style={{ color: '#374151' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: '#e5e7eb' }} />

      {/* Premium section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>Options</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: '#ea580c', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
            Premium
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {PREMIUM_OPTIONS.map(opt => (
            <label key={opt.id}
                   className="flex items-center gap-2.5"
                   style={{ cursor: premium ? 'pointer' : 'default', opacity: premium ? 1 : 0.5 }}>
              <input
                type="checkbox"
                checked={selected === opt.id}
                disabled={!premium}
                onChange={() => premium && onChange(selected === opt.id ? '' : opt.id)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: '#7c3aed' }}
              />
              <span className="text-sm" style={{ color: '#374151' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  )
}
