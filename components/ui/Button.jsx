'use client'

import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-[var(--lt-accent)] hover:bg-[var(--lt-accent-hover)] text-white shadow-sm',
  secondary: 'bg-[var(--lt-card-hover)] hover:bg-[var(--lt-divider)] text-[var(--lt-text-primary)] border border-[var(--lt-divider-light)]',
  ghost:     'bg-transparent hover:bg-[var(--lt-card-hover)] text-[var(--lt-text-muted)] hover:text-[var(--lt-text-primary)]',
  danger:    'bg-[var(--color-danger)] hover:bg-[var(--color-danger-hover)] text-white shadow-sm',
  outline:   'bg-transparent border border-[var(--lt-divider-light)] hover:border-[var(--lt-accent)] text-[var(--lt-text-primary)]',
}

const sizes = {
  xs:  'h-6  px-2   text-xs  gap-1',
  sm:  'h-8  px-3   text-sm  gap-1.5',
  md:  'h-9  px-4   text-sm  gap-2',
  lg:  'h-10 px-5   text-base gap-2',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  className,
  disabled,
  children,
  icon,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] font-medium',
        'transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lt-accent)]/60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
