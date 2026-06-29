'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FileText, Settings, BarChart2, Layers,
  LogOut, Crown, ToggleLeft, ToggleRight, TrendingUp,
} from 'lucide-react'

const QUICK_LINKS = [
  { href: '/pdf-tool', label: 'PDF Tool',     icon: FileText, desc: 'Sort & crop shipping labels' },
  { href: '/settings', label: 'Settings',     icon: Settings, desc: 'Theme, profile, company'     },
]

export default function AdminDashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [stats,    setStats]    = useState({ processed: 0 })
  const [premium,  setPremium]  = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('pdf-tool-admin-token')
    if (!token) { router.push('/admin/login'); return }
    setUsername(localStorage.getItem('pdf-tool-admin-username') || 'admin')
    const processed = parseInt(localStorage.getItem('pdf-tool-processed-count') || '0', 10)
    const prem      = localStorage.getItem('pdf-tool-premium') === 'true'
    setStats({ processed })
    setPremium(prem)
  }, [router])

  function logout() {
    localStorage.removeItem('pdf-tool-admin-token')
    localStorage.removeItem('pdf-tool-admin-username')
    router.push('/admin/login')
  }

  function togglePremium() {
    const next = !premium
    setPremium(next)
    localStorage.setItem('pdf-tool-premium', String(next))
  }

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--lt-text-primary)' }}>
              Admin Dashboard
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--lt-text-subtle)' }}>
              Signed in as <span style={{ color: 'var(--lt-accent-light)' }}>{username}</span>
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--lt-text-subtle)', border: '1px solid var(--lt-divider)' }}
          >
            <LogOut size={13} /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--lt-card)', border: '1px solid var(--lt-divider)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={14} style={{ color: 'var(--lt-accent-light)' }} />
              <span className="text-xs font-medium" style={{ color: 'var(--lt-text-subtle)' }}>PDFs Processed</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--lt-text-primary)' }}>{stats.processed}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--lt-card)', border: '1px solid var(--lt-divider)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Crown size={14} className="text-amber-400" />
              <span className="text-xs font-medium" style={{ color: 'var(--lt-text-subtle)' }}>Plan</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--lt-text-primary)' }}>
              {premium ? 'Premium' : 'Free'}
            </p>
          </div>
        </div>

        {/* Premium toggle */}
        <div className="p-4 rounded-xl flex items-center justify-between"
             style={{ backgroundColor: 'var(--lt-card)', border: '1px solid var(--lt-divider)' }}>
          <div className="flex items-center gap-2.5">
            <Crown size={16} className="text-amber-400" />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--lt-text-primary)' }}>Premium Features</p>
              <p className="text-xs" style={{ color: 'var(--lt-text-subtle)' }}>
                Enable Pick List & Master Pick List sorting
              </p>
            </div>
          </div>
          <button onClick={togglePremium} className="transition-colors">
            {premium
              ? <ToggleRight size={28} style={{ color: 'var(--lt-accent)' }} />
              : <ToggleLeft  size={28} style={{ color: 'var(--lt-text-subtle)' }} />}
          </button>
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: 'var(--lt-text-subtle)' }}>Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href}
                    className="p-4 rounded-xl flex flex-col gap-2 transition-colors"
                    style={{ backgroundColor: 'var(--lt-card)', border: '1px solid var(--lt-divider)' }}>
                <Icon size={18} style={{ color: 'var(--lt-accent-light)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--lt-text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--lt-text-subtle)' }}>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
