import { Link, useParams } from 'react-router-dom'
import { getTeamDetail } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'

const SECTION_LINKS: Record<string, string> = {
  Outcomes:   '/outcomes',
  Cost:       '/cost',
  Reliability:'/reliability',
  Governance: '/governance',
}

type Format = 'number' | 'percent' | 'currency' | 'duration'

const MINI_SECTIONS: Array<{
  label: string
  key: 'outcomes' | 'cost' | 'reliability' | 'governance'
  labels: [string, string]
  formats: [Format, Format]
}> = [
  {
    label: 'Outcomes',
    key: 'outcomes',
    labels: ['Merge Rate', 'Avg Edit Distance'],
    formats: ['percent', 'percent'],
  },
  {
    label: 'Cost',
    key: 'cost',
    labels: ['Cost/Merged PR', 'Token Waste %'],
    formats: ['currency', 'percent'],
  },
  {
    label: 'Reliability',
    key: 'reliability',
    labels: ['P95 Task Duration', 'Tool Failure Rate'],
    formats: ['duration', 'percent'],
  },
  {
    label: 'Governance',
    key: 'governance',
    labels: ['Policy Blocks', 'Secrets Detected'],
    formats: ['number', 'number'],
  },
]

export default function TeamDetailPage() {
  const { teamId = '' } = useParams<{ teamId: string }>()
  const { period } = useFilters()
  const { data, loading } = useMockData(() => getTeamDetail(teamId, period), [teamId, period])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading team detail">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  const { team, autonomyRate, taskCount, spendUsd, sections, members } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50">{team.name}</h1>
            <p className="text-sm text-slate-400 mt-1">{team.memberCount} members</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-slate-400">Tasks</p><p className="text-2xl font-bold tabular-nums text-slate-50">{taskCount}</p></div>
            <div><p className="text-xs text-slate-400">Autonomy</p><p className="text-2xl font-bold tabular-nums text-slate-50">{formatPercent(autonomyRate)}</p></div>
            <div><p className="text-xs text-slate-400">Spend</p><p className="text-2xl font-bold tabular-nums text-slate-50">{formatCurrency(spendUsd)}</p></div>
          </div>
        </div>
      </div>

      {/* Mini sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MINI_SECTIONS.map(({ label, key, labels, formats }) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</h2>
              <Link
                to={`${SECTION_LINKS[label]}?team=${teamId}`}
                className="text-xs text-orange-400 hover:text-orange-300"
              >
                View full →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {sections[key].map((kpi, i) => (
                <KpiCard key={i} title={labels[i]} value={kpi.value} format={formats[i]} trend={kpi.trendPct} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team members</h2>
        <table className="w-full" aria-label="Members">
          <caption className="sr-only">Self-service stats — not a ranking</caption>
          <thead className="bg-slate-800">
            <tr>
              {['Member', 'Tasks', 'Autonomy %', 'Spend'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-slate-800/50">
                <td className="px-3 py-2 text-sm text-slate-200 font-medium">{m.name}</td>
                <td className="px-3 py-2 text-sm text-slate-400 tabular-nums">{m.taskCount}</td>
                <td className="px-3 py-2 text-sm text-slate-400 tabular-nums">{formatPercent(m.autonomyRate)}</td>
                <td className="px-3 py-2 text-sm text-slate-400 tabular-nums">{formatCurrency(m.spendUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-500">Self-service stats — not a ranking</p>
      </div>
    </div>
  )
}
