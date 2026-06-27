import type { Severity } from '../../types'

interface AlertBadgeProps {
  severity: Severity
  label: string
}

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  warning:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info:     'bg-sky-500/20 text-sky-400 border-sky-500/30',
}

export function AlertBadge({ severity, label }: AlertBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_STYLES[severity]}`} data-testid="alert-badge">
      {label}
    </span>
  )
}
