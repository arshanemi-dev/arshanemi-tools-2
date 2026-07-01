'use client'

export const PLATFORMS = [
  { id: 'manual',   label: 'Manual'          },
  { id: 'meesho',   label: 'Meesho Label'    },
  { id: 'flipkart', label: 'Flipkart Label'  },
  { id: 'amazon',   label: 'Amazon Label'    },
  { id: 'myntra',   label: 'Myntra Label'    },
  { id: 'snapdeal', label: 'Snapdeal Label'  },
]

export default function PlatformTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {PLATFORMS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
          style={active === id ? {
            backgroundColor: 'var(--lt-accent)',
            color: '#fff',
            borderColor: 'var(--lt-accent)',
          } : {
            backgroundColor: 'var(--lt-card)',
            color: 'var(--lt-text-muted)',
            borderColor: 'var(--lt-divider-light)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
