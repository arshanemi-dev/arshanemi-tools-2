import { cn } from '@/lib/utils'

export default function Spinner({ size = 'md', className }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7', xl: 'w-10 h-10' }
  return (
    <span
      className={cn(
        'inline-block rounded-full border-2 border-[var(--lt-divider-light)] border-t-[var(--lt-accent)] animate-spin',
        sizes[size] ?? sizes.md,
        className
      )}
    />
  )
}
