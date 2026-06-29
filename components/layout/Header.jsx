'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Settings, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/pdf-tool',  label: 'PDF Tool',  icon: FileText },
  { href: '/settings',  label: 'Settings',  icon: Settings },
  { href: '/admin',     label: 'Admin',     icon: LayoutDashboard },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center border-b border-[var(--lt-divider)] bg-[var(--lt-bg-base)]/90 backdrop-blur-md px-4">
      <div className="flex items-center gap-3 flex-1">
        <Link href="/pdf-tool" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-[8px] bg-[var(--lt-accent-muted)] border border-[var(--lt-accent)]/40 flex items-center justify-center">
            <FileText size={16} className="text-[var(--lt-accent-light)]" />
          </div>
          <span className="font-semibold text-[var(--lt-text-primary)] text-sm tracking-tight">
            ArshaNemi<span className="text-[var(--lt-accent)]"> PDF Tools</span>
          </span>
        </Link>
      </div>

      <nav className="flex items-center gap-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={label}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-sm transition-colors',
              pathname?.startsWith(href)
                ? 'text-[var(--lt-accent-light)] bg-[var(--lt-accent-muted)]'
                : 'text-[var(--lt-text-subtle)] hover:text-[var(--lt-text-primary)] hover:bg-[var(--lt-card-hover)]'
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  )
}
