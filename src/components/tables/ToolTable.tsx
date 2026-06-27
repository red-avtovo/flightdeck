import type { ToolStat } from '../../types'
import { formatDuration, formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

interface ToolTableProps {
  rows: ToolStat[]
  loading?: boolean
}

export function ToolTable({ rows, loading = false }: ToolTableProps) {
  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => b.errorRate - a.errorRate)

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300 tabular-nums'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Tool</th>
            <th className={thClass}>Calls</th>
            <th className={thClass}>Error Rate</th>
            <th className={thClass}>P50 Latency</th>
            <th className={thClass}>P95 Latency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={5}><EmptyState /></td></tr>
          ) : (
            sorted.map(row => (
              <tr key={row.tool} className="hover:bg-slate-800/50 transition-colors">
                <td className={`${tdClass} font-mono`}>{row.tool.replace(/_/g, ' ')}</td>
                <td className={tdClass}>{row.callCount.toLocaleString()}</td>
                <td className={`${tdClass} ${row.errorRate > 0.1 ? 'text-rose-400' : ''}`}>{formatPercent(row.errorRate)}</td>
                <td className={tdClass}>{formatDuration(row.p50LatencyMs)}</td>
                <td className={tdClass}>{formatDuration(row.p95LatencyMs)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
