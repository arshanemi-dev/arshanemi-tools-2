'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'
const ADMIN_URL  = process.env.NEXT_PUBLIC_ADMIN_URL  || ''

function PdfIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.7802 25.9435V19.6158H25.9441M24.8895 22.7797H22.7802M9.07027 25.9435V19.6158M9.07027 19.6158H11.1795C12.0532 19.6158 12.7614 20.3241 12.7614 21.1978C12.7614 22.0715 12.0532 22.7797 11.1795 22.7797H9.07027V19.6158ZM10.5467 9.49154V15.8192M12.656 13.71L10.5467 15.8192L8.4375 13.71M20.0383 15.8192V7.38226M17.5072 25.9435H15.9253V19.6158H17.5072C18.6721 19.6158 19.6164 20.5602 19.6164 21.7251V23.8343C19.6164 24.9992 18.6721 25.9435 17.5072 25.9435Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7101 1.05461H3.16392C1.99904 1.05461 1.05469 1.99897 1.05469 3.16384V23.8343C1.05469 24.9991 1.99904 25.9435 3.16392 25.9435H5.27314M13.7101 1.05461V5.27307C13.7101 6.43794 14.6544 7.38229 15.8193 7.38229H20.0377L13.7101 1.05461Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const BASE_NAV = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

function handleLogout() {
  localStorage.removeItem('lt_auth_token')
  localStorage.removeItem('lt_auth_user')
  window.location.reload()
}

export default function Header({ authUser }) {
  const pathname = usePathname()

  const nav = IS_CONNECT && ADMIN_URL
    ? [...BASE_NAV, { href: ADMIN_URL, label: 'Admin', icon: LayoutDashboard, external: true }]
    : BASE_NAV

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[var(--lt-divider)] bg-[var(--lt-bg-base)]/90 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 flex-1">
        <Link href="/pdf-tool" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center text-[var(--lt-accent-light)]">
            <PdfIcon size={16} />
          </div>
          <span className="font-semibold text-[var(--lt-text-primary)] text-sm tracking-tight">
            ArshaNemi<span className="text-[var(--lt-accent)]"> PDF Tools</span>
          </span>
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        {nav.map(({ href, label, icon: Icon, isPdf, external }) => (
          <Link
            key={href}
            href={href}
            title={label}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-sm transition-colors',
              !external && pathname?.startsWith(href)
                ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)]'
                : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
            )}
          >
            {isPdf ? <PdfIcon size={14} /> : Icon ? <Icon size={14} /> : null}
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}

        {/* Logged-in user pill + logout (only in connected mode) */}
        {!IS_CONNECT && authUser && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-[var(--lt-divider)]">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--lt-card)] border border-[var(--lt-divider)] rounded-[8px]">
              <div className="w-5 h-5 rounded-full bg-[var(--lt-accent)] flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {(authUser.name?.[0] ?? authUser.email?.[0] ?? '?').toUpperCase()}
              </div>
              <span className="text-xs font-medium text-[var(--lt-text-primary)] hidden sm:block max-w-[100px] truncate">
                {authUser.name || authUser.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-[var(--lt-text-subtle)] hover:text-[var(--lt-danger-text)] hover:bg-[var(--lt-danger-bg)] rounded-[6px] transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}
