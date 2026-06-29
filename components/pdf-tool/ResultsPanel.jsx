'use client'

import { Eye, Tag, Truck, CalendarDays } from 'lucide-react'

const PLATFORM_LABELS = {
  myntra: 'Myntra', flipkart: 'Flipkart', meesho: 'Meesho',
  amazon: 'Amazon', snapdeal: 'Snapdeal', manual: 'Manual',
}

export default function ResultsPanel({ result, onPreview }) {
  if (!result) return null
  const { platform, pageCount, sortMode, labelsSummary } = result

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#e5e7eb', backgroundColor: '#fff' }}>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 px-4 pt-3 pb-2">
        <Chip label={`Platform: ${PLATFORM_LABELS[platform] || platform}`} color="green" />
        <Chip label={`${pageCount} pages`} color="indigo" />
        <Chip label={`Sorted: ${sortMode}`} color="indigo" />
      </div>

      {/* Label table */}
      {labelsSummary?.length > 0 && (
        <div className="overflow-x-auto border-t" style={{ borderColor: '#f3f4f6' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: '#6b7280' }}>#</th>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: '#6b7280' }}>
                  <span className="flex items-center gap-1"><Tag size={10} />SKU</span>
                </th>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: '#6b7280' }}>
                  <span className="flex items-center gap-1"><Truck size={10} />Courier</span>
                </th>
                <th className="px-3 py-2 text-left font-semibold" style={{ color: '#6b7280' }}>
                  <span className="flex items-center gap-1"><CalendarDays size={10} />Date</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {labelsSummary.slice(0, 8).map((label, i) => (
                <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td className="px-3 py-1.5" style={{ color: '#9ca3af' }}>{i + 1}</td>
                  <td className="px-3 py-1.5 font-mono font-semibold" style={{ color: '#7c3aed' }}>
                    {label.sku || '—'}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: '#374151' }}>{label.courierPartner || '—'}</td>
                  <td className="px-3 py-1.5" style={{ color: '#374151' }}>{label.orderDate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {labelsSummary.length > 8 && (
            <p className="px-3 py-1.5 text-xs border-t" style={{ color: '#9ca3af', borderColor: '#f3f4f6' }}>
              +{labelsSummary.length - 8} more pages
            </p>
          )}
        </div>
      )}

      {/* Preview & Download */}
      <div className="px-4 py-3 border-t" style={{ borderColor: '#e5e7eb' }}>
        <button
          onClick={onPreview}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity"
          style={{ backgroundColor: '#7c3aed' }}
        >
          <Eye size={15} />
          Preview &amp; Download
        </button>
      </div>
    </div>
  )
}

function Chip({ label, color }) {
  const styles = {
    green:  { color: '#16a34a', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' },
    indigo: { color: '#7c3aed', backgroundColor: '#f3f0ff', border: '1px solid #ddd6fe' },
  }
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={styles[color]}>{label}</span>
  )
}
