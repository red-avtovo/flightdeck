import { useEffect, useRef, useState } from 'react'
import type { SecurityEvent, SecurityEventType } from '../../types'
import { AlertBadge } from '../cards/AlertBadge'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

const EVENT_TYPE_LABELS: Record<SecurityEventType, string> = {
  policy_block:             'Policy Block',
  secret_detected:          'Secret Detected',
  human_approval_required:  'Human Approval',
}

interface EventLogProps {
  events: SecurityEvent[]
  loading?: boolean
  /** Id of an event to scroll to + highlight — set when arriving from an Overview alert. */
  highlightEventId?: string
}

type Filter = 'all' | SecurityEventType

export function EventLog({ events, loading = false, highlightEventId }: EventLogProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  // Bring the deep-linked row into view when we arrive from an Overview alert.
  useEffect(() => {
    if (highlightEventId) highlightRef.current?.scrollIntoView({ block: 'center' })
  }, [highlightEventId, filter])

  if (loading) return <Skeleton className="h-64 w-full" />

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter)

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label htmlFor="event-filter" className="text-xs text-slate-400">Filter:</label>
        <select
          id="event-filter"
          className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          value={filter}
          onChange={e => setFilter(e.target.value as Filter)}
        >
          <option value="all">All types</option>
          <option value="policy_block">Policy Block</option>
          <option value="secret_detected">Secret Detected</option>
          <option value="human_approval_required">Human Approval</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className={thClass}>Severity</th>
              <th className={thClass}>Type</th>
              <th className={thClass}>Task ID</th>
              <th className={thClass}>Repo</th>
              <th className={thClass}>Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={5}><EmptyState message="No events found" /></td></tr>
            ) : (
              filtered.map(event => {
                const highlighted = event.id === highlightEventId
                return (
                <tr
                  key={event.id}
                  ref={highlighted ? highlightRef : undefined}
                  data-highlighted={highlighted || undefined}
                  className={`transition-colors ${highlighted ? 'bg-orange-500/10 ring-1 ring-inset ring-orange-500/50' : 'hover:bg-slate-800/50'}`}
                >
                  <td className={tdClass}><AlertBadge severity={event.severity} label={event.severity} /></td>
                  <td className={tdClass}>{EVENT_TYPE_LABELS[event.type]}</td>
                  <td className={`${tdClass} font-mono text-xs`}>{event.taskId}</td>
                  <td className={tdClass}>{event.repoId}</td>
                  <td className={tdClass}>{new Date(event.createdAt).toLocaleString()}</td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
