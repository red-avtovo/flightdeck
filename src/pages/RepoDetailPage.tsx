import { Link, useParams } from 'react-router-dom'
import { getRepoDetail } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'

type Format = 'number' | 'percent' | 'currency' | 'duration'

function ReadinessBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${ok ? 'border-emerald-700 bg-emerald-950/40 text-emerald-400' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>
      <span aria-hidden>{ok ? '✓' : '✗'}</span>
      {label}
    </div>
  )
}

const SECTION_LINKS: Record<string, string> = {
  Outcomes:   '/outcomes',
  Cost:       '/cost',
  Reliability:'/reliability',
  Governance: '/governance',
}

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

export default function RepoDetailPage() {
  const { repoId = '' } = useParams<{ repoId: string }>()
  const { period } = useFilters()
  const { data, loading } = useMockData(() => getRepoDetail(repoId, period), [repoId, period])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading repo detail">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    )
  }

  const { repo, teamName, autonomyRate, taskCount, spendUsd, sections } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50 font-mono">{repo.name}</h1>
            <p className="text-sm text-slate-400 mt-1">Repo drill-down · {teamName} team</p>
          </div>
          <div className="flex gap-6 text-right">
            <div><p className="text-xs text-slate-400">Tasks</p><p className="text-2xl font-bold text-slate-50">{taskCount}</p></div>
            <div><p className="text-xs text-slate-400">Autonomy</p><p className="text-2xl font-bold text-slate-50">{formatPercent(autonomyRate)}</p></div>
            <div><p className="text-xs text-slate-400">Spend</p><p className="text-2xl font-bold text-slate-50">{formatCurrency(spendUsd)}</p></div>
          </div>
        </div>
      </div>

      {/* Repo Readiness strip */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">Repo Readiness</h2>
        <div className="flex flex-wrap gap-2">
          <ReadinessBadge ok={repo.testCommandDetected} label="Test command detected" />
          <ReadinessBadge ok={repo.ciConfigured} label="CI configured" />
          <ReadinessBadge ok={repo.agentInstructionsPresent} label="Agent instructions present" />
        </div>
      </div>

      {/* Mini sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {MINI_SECTIONS.map(({ label, key, labels, formats }) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</h2>
              <Link to={`${SECTION_LINKS[label]}?repo=${repoId}`} className="text-xs text-orange-400 hover:text-orange-300">
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
    </div>
  )
}
