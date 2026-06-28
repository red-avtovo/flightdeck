import { useState } from 'react'
import type { OutcomesMetrics, TaskType } from '../../types'
import { formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type Row = OutcomesMetrics['prOutcomes'][number]
type SortKey = keyof Omit<Row, 'repoId' | 'taskType'>

interface OutcomeTableProps {
  rows: Row[]
  loading?: boolean
}

const COLS: { key: SortKey; label: string }[] = [
  { key: 'mergeRate',             label: 'Merge Rate' },
  { key: 'avgEditDistancePct',    label: 'Avg Edit Dist' },
  { key: 'ciFirstAttemptPassRate', label: 'CI Pass (1st)' },
]

const badge =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap capitalize'

// Distinct colour per task type so they're scannable at a glance (no ranking implied).
const TASK_TYPE_BADGE: Record<TaskType, string> = {
  bug_fix:            'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  feature:            'bg-indigo-500/10 text-indigo-300 ring-indigo-500/30',
  tests:              'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  docs:               'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  refactor:           'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  dependency_update:  'bg-violet-500/10 text-violet-300 ring-violet-500/30',
}

// Traffic-light colour for a rate. `value` is normalised to 0–1.
// higherIsBetter=false flips the scale (e.g. edit distance — less rework is better).
function rateColor(value: number, higherIsBetter = true): string {
  const good = higherIsBetter ? value >= 0.7 : value <= 0.2
  const warn = higherIsBetter ? value >= 0.4 : value <= 0.4
  if (good) return 'text-emerald-300'
  if (warn) return 'text-amber-300'
  return 'text-rose-300'
}

export function OutcomeTable({ rows, loading = false }: OutcomeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('mergeRate')
  const [asc, setAsc] = useState(false)

  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return asc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) setAsc(p => !p)
    else { setSortKey(key); setAsc(false) }
  }

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  // No text color here on purpose: numeric cells add their own traffic-light color
  // via rateColor(). Two `text-*` color utilities on one element tie on specificity,
  // so the winner is decided by stylesheet order — and `slate` is a custom (extended)
  // color now, emitted after emerald/amber/rose, so a base `text-slate-300` would
  // override the rate color and gray out every number. Apply the slate color per-cell.
  const tdClass = 'px-3 py-2 text-sm'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Repo</th>
            <th className={thClass}>Task Type</th>
            {COLS.map(col => (
              <th key={col.key} className={thClass}>
                <button onClick={() => handleSort(col.key)} className="hover:text-slate-200 transition-colors" aria-label={`Sort by ${col.label}`}>
                  {col.label} {sortKey === col.key ? (asc ? '↑' : '↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={5}><EmptyState message="No PR outcomes found" /></td></tr>
          ) : (
            sorted.map((row, i) => (
              <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                <td className={`${tdClass} text-slate-300`}>{row.repoId}</td>
                <td className={tdClass}>
                  <span className={`${badge} ${TASK_TYPE_BADGE[row.taskType]}`}>
                    {row.taskType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={`${tdClass} tabular-nums font-medium ${rateColor(row.mergeRate)}`}>
                  {formatPercent(row.mergeRate)}
                </td>
                <td className={`${tdClass} tabular-nums font-medium ${rateColor(row.avgEditDistancePct / 100, false)}`}>
                  {row.avgEditDistancePct.toFixed(1)}%
                </td>
                <td className={`${tdClass} tabular-nums font-medium ${rateColor(row.ciFirstAttemptPassRate)}`}>
                  {formatPercent(row.ciFirstAttemptPassRate)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
