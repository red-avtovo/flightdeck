import { useState } from 'react'
import type { OutcomesMetrics } from '../../types'
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
  const tdClass = 'px-3 py-2 text-sm text-slate-300'

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
                <td className={tdClass}>{row.repoId}</td>
                <td className={tdClass}>{row.taskType.replace(/_/g, ' ')}</td>
                <td className={tdClass}>{formatPercent(row.mergeRate)}</td>
                <td className={tdClass}>{row.avgEditDistancePct.toFixed(1)}%</td>
                <td className={tdClass}>{formatPercent(row.ciFirstAttemptPassRate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
