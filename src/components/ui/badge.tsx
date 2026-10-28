import { cn } from '@/src/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-bg-tertiary text-text-secondary',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  error: 'bg-error-subtle text-error',
  info: 'bg-info-subtle text-info',
  accent: 'bg-accent-subtle text-accent',
  muted: 'bg-bg-tertiary text-text-muted',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// Status-to-variant mapping for reuse
export function getStatusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    // Opportunity statuses
    SAVED: 'muted',
    TO_REVIEW: 'info',
    READY_TO_APPLY: 'accent',
    APPLIED: 'info',
    ASSESSMENT: 'warning',
    INTERVIEW: 'warning',
    OFFER: 'success',
    REJECTED: 'error',
    CLOSED: 'muted',
    // Relationship statuses
    TO_RESEARCH: 'muted',
    READY_FOR_OUTREACH: 'accent',
    REQUEST_SENT: 'info',
    CONNECTED: 'success',
    MESSAGE_SENT: 'info',
    REPLIED: 'success',
    REFERRAL_DISCUSSED: 'warning',
    FOLLOW_UP_NEEDED: 'warning',
    ARCHIVED: 'muted',
    // Verification
    VERIFIED: 'success',
    OUTDATED: 'error',
    UNCERTAIN: 'muted',
    // Priority
    LOW: 'muted',
    MEDIUM: 'default',
    HIGH: 'warning',
    URGENT: 'error',
    // Follow-up states
    OPEN: 'info',
    COMPLETED: 'success',
    DISMISSED: 'muted',
  }
  return map[status] || 'default'
}

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Mid Level', 'Mid-level')
    .replace('On Site', 'On-site')
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={getStatusVariant(status)}>
      {formatEnumLabel(status)}
    </Badge>
  )
}
