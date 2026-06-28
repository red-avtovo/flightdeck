import { Link } from 'react-router-dom'
import { AlertTriangle, X } from 'lucide-react'
import type { Alert, Severity } from '../../types'

interface AlertsPanelProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
}

// Severity is shown only by the leading dot (no redundant coloured chip/border).
const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-rose-400',
  warning:  'bg-amber-400',
  info:     'bg-sky-400',
}

// Security-event alerts deep-link to their row in the Governance event log; the
// cost-spike anomaly has no event, so it points at the Cost page instead.
function hrefFor(alert: Alert): string {
  return alert.source === 'security_event' ? `/governance?event=${alert.refId}` : '/cost'
}

/**
 * Titled panel listing active alerts as separated, scannable rows — replaces the
 * old inline flex-wrap strip where every badge/message/dismiss ran together into a
 * wall of text. Each row: a severity dot, the alert type in bold, and a muted detail
 * (task + repo, or a measurable reason). The type is NOT repeated in the detail.
 * The row links through to the source; the dismiss button sits outside the link so
 * dismissing never navigates.
 */
export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  if (alerts.length === 0) return null

  return (
    <section
      className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/50"
      aria-label="Active alerts"
    >
      <header className="flex items-center justify-between border-b border-slate-700 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-50">Active alerts</span>
          <span className="rounded-full bg-slate-700 px-1.5 text-xs font-semibold text-slate-50">
            {alerts.length}
          </span>
        </div>
        <Link
          to="/governance"
          className="text-xs font-medium text-orange-400 transition-colors hover:text-orange-300"
        >
          View all in Governance →
        </Link>
      </header>

      <ul className="divide-y divide-slate-700/50">
        {alerts.map(alert => {
          const typeLabel = alert.type.replace(/_/g, ' ')
          return (
            <li key={alert.id} className="group flex items-center pr-2">
              <Link
                to={hrefFor(alert)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-800"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[alert.severity]}`} aria-hidden="true" />
                <span className="shrink-0 text-sm font-medium first-letter:uppercase text-slate-50">{typeLabel}</span>
                <span className="flex-1 truncate text-sm text-slate-500">{alert.message}</span>
              </Link>
              <button
                onClick={() => onDismiss(alert.id)}
                aria-label={`Dismiss alert: ${typeLabel}`}
                className="ml-1 shrink-0 rounded p-1 text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
