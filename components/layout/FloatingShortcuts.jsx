'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

function PdfIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.7802 25.9435V19.6158H25.9441M24.8895 22.7797H22.7802M9.07027 25.9435V19.6158M9.07027 19.6158H11.1795C12.0532 19.6158 12.7614 20.3241 12.7614 21.1978C12.7614 22.0715 12.0532 22.7797 11.1795 22.7797H9.07027V19.6158ZM10.5467 9.49154V15.8192M12.656 13.71L10.5467 15.8192L8.4375 13.71M20.0383 15.8192V7.38226M17.5072 25.9435H15.9253V19.6158H17.5072C18.6721 19.6158 19.6164 20.5602 19.6164 21.7251V23.8343C19.6164 24.9992 18.6721 25.9435 17.5072 25.9435Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.7101 1.05461H3.16392C1.99904 1.05461 1.05469 1.99897 1.05469 3.16384V23.8343C1.05469 24.9991 1.99904 25.9435 3.16392 25.9435H5.27314M13.7101 1.05461V5.27307C13.7101 6.43794 14.6544 7.38229 15.8193 7.38229H20.0377L13.7101 1.05461Z" stroke="currentColor" strokeWidth="2.10923" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/pdf-tool', label: 'PDF Tool', isPdf: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function ShortcutBtn({ isActive, icon: Icon, isPdf, label, children }) {
  return (
    <span
      title={label}
      className={cn(
        'group relative flex items-center justify-center w-11 h-11 rounded-[12px] border shadow-lg transition-all duration-150',
        isActive
          ? 'bg-[var(--lt-accent)] border-[var(--lt-accent)] text-white shadow-[0_4px_16px_0_var(--lt-accent)]/40'
          : 'bg-[var(--lt-card)] border-[var(--lt-divider)] text-[var(--lt-text-subtle)] hover:bg-[var(--lt-card-hover)] hover:border-[var(--lt-divider-light)] hover:text-[var(--lt-text-primary)] hover:shadow-xl'
      )}
    >
      {isPdf ? <PdfIcon size={18} /> : Icon ? <Icon size={18} /> : children}

      {/* Tooltip */}
      <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[7px] bg-[var(--lt-card)] border border-[var(--lt-divider)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--lt-text-primary)] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {label}
      </span>
    </span>
  )
}

function handleLogout() {
  localStorage.removeItem('lt_auth_token')
  localStorage.removeItem('lt_auth_user')
  window.location.reload()
}

export default function FloatingShortcuts() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-center gap-2">

      {/* Nav links */}
      {NAV_ITEMS.map(({ href, label, icon, isPdf }) => (
        <Link key={href} href={href}>
          <ShortcutBtn
            isActive={pathname?.startsWith(href)}
            icon={icon}
            isPdf={isPdf}
            label={label}
          />
        </Link>
      ))}

      {/* Logout */}
      <button onClick={handleLogout}>
        <ShortcutBtn label="Logout" icon={LogOut} isActive={false} />
      </button>

    </div>
  )
}
