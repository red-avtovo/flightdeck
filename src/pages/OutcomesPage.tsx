import { getOutcomesMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { OutcomeTable } from '../components/tables/OutcomeTable'

export default function OutcomesPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getOutcomesMetrics(period, teamId, model), [period, teamId, model])

  const BAND_SERIES = [
    { key: 'autonomous',     label: 'Autonomous',     color: '#10b981' },
    { key: 'human_assisted', label: 'Human-assisted', color: '#0ea5e9' },
    { key: 'human_rescued',  label: 'Human-rescued',  color: '#f59e0b' },
    { key: 'failed',         label: 'Failed',         color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading outcomes">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded bg-slate-800 h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded bg-slate-800 h-64" />
          ))}
        </div>
        <div className="animate-pulse rounded bg-slate-800 h-48" />
      </div>
    )
  }

  const { kpis, editDistanceTrend, outcomeByTaskType, reviewCommentsTrend, prOutcomes } = data

  const editDistanceSeries = [{ key: 'value', label: 'Edit Distance %', color: '#6366f1' }]
  const commentsSeries = [{ key: 'value', label: 'Avg Review Comments', color: '#0ea5e9' }]
  const outcomeData = outcomeByTaskType.map(d => ({ name: d.taskType.replace(/_/g, ' '), ...d }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="sr-only">Outcomes & Quality</h1>
        <p className="text-sm text-slate-400">Is agent output being accepted with minimal human rework?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Merge Rate" value={kpis.mergeRate.value} format="percent" trend={kpis.mergeRate.trendPct} sparkline={kpis.mergeRate.sparkline} tooltip="Merged PRs ÷ PRs opened by agent" />
        <KpiCard title="Human Edit Distance" value={kpis.humanEditDistancePct.value / 100} format="percent" trend={kpis.humanEditDistancePct.trendPct} sparkline={kpis.humanEditDistancePct.sparkline} tooltip="Avg human commits/lines after the agent, over total" higherIsBetter={false} />
        <KpiCard title="CI Pass Rate" value={kpis.ciFirstAttemptPassRate.value} format="percent" trend={kpis.ciFirstAttemptPassRate.trendPct} sparkline={kpis.ciFirstAttemptPassRate.sparkline} tooltip="Share of agent PRs whose FIRST CI run passed" />
        <KpiCard title="Revert Rate" value={kpis.revertRate.value} format="percent" trend={kpis.revertRate.trendPct} sparkline={kpis.revertRate.sparkline} tooltip="PRs reverted ÷ merged PRs" higherIsBetter={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Rework trend over time</h2>
          <LineChart data={editDistanceTrend} series={editDistanceSeries} formatY={v => `${v.toFixed(1)}%`} trend />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Review comments per PR</h2>
          <LineChart data={reviewCommentsTrend} series={commentsSeries} formatY={v => v.toFixed(1)} trend />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 col-span-full">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Outcome by task type</h2>
          <BarChart data={outcomeData} series={BAND_SERIES} xKey="name" stacked formatY={v => `${v}`} allowDecimals={false} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">PR outcomes by repo & task type</h2>
        <OutcomeTable rows={prOutcomes} />
      </div>
    </div>
  )
}
