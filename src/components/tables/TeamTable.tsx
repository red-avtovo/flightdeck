import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TeamMetrics } from '../../types'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { EmptyState } from '../ui/EmptyState'
import { Skeleton } from '../ui/Skeleton'

type SortKey = keyof Omit<TeamMetrics, 'teamId' | 'teamName'>

interface TeamTableProps {
  rows: TeamMetrics[]
  loading?: boolean
}

const COLS: { key: SortKey; label: string; format: (v: number) => string }[] = [
  { key: 'taskCount',       label: 'Tasks',          format: String },
  { key: 'autonomyRate',    label: 'Autonomy',        format: formatPercent },
  { key: 'spendUsd',        label: 'Spend',           format: formatCurrency },
  { key: 'costPerTask',     label: 'Cost/Task',       format: formatCurrency },
  { key: 'costPerMergedPr', label: 'Cost/Merged PR',  format: formatCurrency },
  { key: 'tokenWastePct',   label: 'Token Waste',     format: formatPercent },
]

export function TeamTable({ rows, loading = false }: TeamTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('spendUsd')
  const [asc, setAsc] = useState(false)

  if (loading) return <Skeleton className="h-48 w-full" />

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return asc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) setAsc(prev => !prev)
    else { setSortKey(key); setAsc(false) }
  }

  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300 whitespace-nowrap'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Team</th>
            {COLS.map(col => (
              <th key={col.key} className={thClass}>
                <button
                  onClick={() => handleSort(col.key)}
                  className="hover:text-slate-200 transition-colors"
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label} {sortKey === col.key ? (asc ? '↑' : '↓') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <tr><td colSpan={COLS.length + 1}><EmptyState message="No teams found" /></td></tr>
          ) : (
            sorted.map(row => (
              <tr key={row.teamId} className="hover:bg-slate-800/50 transition-colors">
                <td className={`${tdClass} font-medium`}>
                  <Link to={`/teams/${row.teamId}`} className="text-orange-400 hover:text-orange-300">
                    {row.teamName}
                  </Link>
                </td>
                {COLS.map(col => (
                  <td key={col.key} className={tdClass}>{col.format(row[col.key])}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
