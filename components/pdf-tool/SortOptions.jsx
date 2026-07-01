'use client'

const TOP_OPTIONS = [
  { id: 'sku-group',        label: 'Sort by "SKU Group"',        premium: false },
  { id: 'pickup-partner',   label: 'Sort by "Pickup Partner"',   premium: false },
  { id: 'date',             label: 'Sort by "Date"',             premium: false },
  { id: 'company-wise',     label: 'Sort by "Company Wise"',     premium: false },
  { id: 'master-sku-group', label: 'Sort by "Master SKU Group"', premium: true  },
]

const BOTTOM_OPTIONS = [
  { id: 'pick-list',        label: 'Pick List',        premium: false },
  { id: 'master-pick-list', label: 'Master Pick List', premium: false },
]

function OptionRow({ opt, checked, premium, onChange }) {
  const locked = opt.premium && !premium
  return (
    <label
      className="flex items-center gap-2.5"
      style={{ cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.45 : 1 }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={() => !locked && onChange(checked ? '' : opt.id)}
        className="w-3.5 h-3.5 shrink-0"
        style={{ accentColor: 'var(--lt-accent)' }}
      />
      <span className="text-sm flex-1 text-[var(--lt-text-primary)]">{opt.label}</span>
      {opt.premium && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            color: 'var(--lt-warning)',
            backgroundColor: 'var(--lt-warning-bg)',
            border: '1px solid color-mix(in srgb, var(--lt-warning) 40%, transparent)',
          }}
        >
          Premium
        </span>
      )}
    </label>
  )
}

export default function SortOptions({
  selectedTop,    onChangeTop,
  selectedBottom, onChangeBottom,
  premium,
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--lt-divider)', backgroundColor: 'var(--lt-surface)' }}
    >
      <div className="px-4 pt-4 pb-4">
        <p className="text-sm font-semibold mb-3 text-[var(--lt-text-primary)]">Options</p>

        {/* Section A: basic sort */}
        <div className="flex flex-col gap-3">
          {TOP_OPTIONS.map(opt => (
            <OptionRow
              key={opt.id}
              opt={opt}
              checked={selectedTop === opt.id}
              premium={premium}
              onChange={onChangeTop}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--lt-divider)' }} />
          <span className="text-[10px] font-semibold px-2 shrink-0 text-[var(--lt-text-subtle)]">
            MASTER
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--lt-divider)' }} />
        </div>

        {/* Section B: master sort */}
        <div className="flex flex-col gap-3">
          {BOTTOM_OPTIONS.map(opt => (
            <OptionRow
              key={opt.id}
              opt={opt}
              checked={selectedBottom === opt.id}
              premium={premium}
              onChange={onChangeBottom}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
