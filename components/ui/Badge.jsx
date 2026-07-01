import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-[var(--lt-card-hover)] text-[var(--lt-text-muted)] border border-[var(--lt-divider-light)]',
  accent:  'bg-[var(--lt-accent-muted)] text-[var(--lt-accent-light)] border border-[var(--lt-accent)]/30',
  success: 'bg-[var(--lt-success-bg)] text-[var(--lt-success)] border border-[var(--lt-success)]/30',
  warning: 'bg-[var(--lt-warning-bg)] text-[var(--lt-warning)] border border-[var(--lt-warning)]/30',
  danger:  'bg-[var(--lt-danger-bg)] text-[var(--lt-danger-text)] border border-[var(--lt-danger-text)]/30',
}

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
