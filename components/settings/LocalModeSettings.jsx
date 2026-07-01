'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Users, Palette, CheckCircle, Building2, Database } from 'lucide-react'
import {
  getUsers, getActiveUserId, getActiveUser,
  getCompanies,
} from '@/lib/dataStore'
import ProfilePanel from './local/ProfilePanel'
import UsersPanel   from './local/UsersPanel'
import ThemePanel   from './local/ThemePanel'
import CompanyPanel from './local/CompanyPanel'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile',      label: 'Profile',      icon: User      },
  { id: 'company',      label: 'Company',      icon: Building2 },
  { id: 'users',        label: 'Users',         icon: Users     },
  { id: 'theme',        label: 'Theme',         icon: Palette   },
  // { id: 'subscription', label: 'Subscription',  icon: Crown     },
]

function Section({ title, action, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--lt-divider)] pb-2.5">
        <h3 className="text-sm font-bold text-[var(--lt-text-primary)]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function LocalModeSettings() {
  const [tab,          setTab]      = useState('profile')
  const [users,        setUsers]    = useState([])
  const [companies,    setCompanies] = useState([])
  const [activeUserId, setAUID]     = useState(null)
  const [activeUser,   setAU]       = useState(null)

  const refresh = useCallback(async () => {
    const [u, c] = await Promise.all([getUsers(), getCompanies()])
    setUsers(u)
    setCompanies(c)
    const aid = getActiveUserId()
    setAUID(aid)
    setAU(getActiveUser(u))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[22px] font-bold text-[var(--lt-text-primary)] tracking-tight">Settings</h1>
            <span className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-[var(--lt-success)] bg-[var(--lt-success-bg)] border border-[var(--lt-success)]/25 px-2.5 py-1 rounded-full">
              <Database size={8} />
              JSON Files
            </span>
          </div>
          <p className="text-sm text-[var(--lt-text-subtle)]">
            Users &amp; companies saved to data/users.json and data/company.json
          </p>
        </div>

        {/* Active user pill */}
        {activeUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/30 rounded-full shrink-0">
            <div className="w-5 h-5 rounded-full bg-[var(--lt-accent)] flex items-center justify-center text-[9px] font-bold text-white">
              {activeUser.name[0].toUpperCase()}
            </div>
            <span className="text-xs font-medium text-[var(--lt-accent-light)] truncate max-w-[120px]">
              {activeUser.name}
            </span>
            <CheckCircle size={11} className="text-[var(--lt-success)] shrink-0" />
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-[var(--lt-bg-base)] border border-[var(--lt-divider)] rounded-[12px] mb-7">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[9px] text-xs font-semibold transition-all',
                active
                  ? 'bg-[var(--lt-accent)] text-white shadow-sm'
                  : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-muted)] hover:bg-[var(--lt-card)]'
              )}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="flex flex-col gap-6">

        {/* Profile */}
        {tab === 'profile' && (
          <Section title="Active Profile">
            <ProfilePanel
              user={activeUser}
              onGoToUsers={() => setTab('users')}
            />
          </Section>
        )}

        {/* Company CRUD */}
        {tab === 'company' && (
          <Section title="Local Companies">
            <CompanyPanel
              companies={companies}
              allUsers={users}
              onRefresh={refresh}
            />
          </Section>
        )}

        {/* Users CRUD */}
        {tab === 'users' && (
          <Section title="Local Users">
            <UsersPanel
              users={users}
              companies={companies}
              activeUserId={activeUserId}
              onRefresh={refresh}
            />
          </Section>
        )}

        {/* Theme */}
        {tab === 'theme' && (
          <Section title="Theme">
            <ThemePanel />
          </Section>
        )}

      </div>
    </div>
    </div>
  )
}
