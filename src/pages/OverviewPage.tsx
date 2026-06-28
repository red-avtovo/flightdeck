import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getOrgOverview } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { AutonomyBar } from '../components/charts/AutonomyBar'
import { StackedAreaChart } from '../components/charts/StackedAreaChart'
import { ScatterChart } from '../components/charts/ScatterChart'
import { AlertBadge } from '../components/cards/AlertBadge'
import type { AutonomyBand } from '../types'

export default function OverviewPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getOrgOverview(period, teamId, model), [period, teamId, model])
  const [activeBand, setActiveBand] = useState<AutonomyBand | null>(null)
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set())

  function dismissAlert(id: string) {
    setDismissedAlertIds(prev => new Set([...prev, id]))
  }

  const BAND_SERIES = [
    { key: 'autonomous',    label: 'Autonomous',     color: '#10b981' },
    { key: 'human_assisted',label: 'Human-assisted', color: '#0ea5e9' },
    { key: 'human_rescued', label: 'Human-rescued',  color: '#f59e0b' },
    { key: 'failed',        label: 'Failed',         color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading overview">
        <div className="animate-pulse rounded bg-slate-800 h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse rounded bg-slate-800 h-24" />)}
        </div>
        <div className="animate-pulse rounded bg-slate-800 h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded bg-slate-800 h-64" />
          <div className="animate-pulse rounded bg-slate-800 h-64" />
        </div>
      </div>
    )
  }

  const { autonomyBreakdown, kpis, tasksOverTime, teamScatter, alerts } = data
  const visibleAlerts = alerts.filter(a => !dismissedAlertIds.has(a.id))
  const filteredOverTime = activeBand
    ? tasksOverTime.map(d => ({ date: d.date, [activeBand]: d[activeBand] }))
    : tasksOverTime

  return (
    <div className="space-y-8">
      <div>
        <h1 className="sr-only">Organization Overview</h1>
        <p className="text-sm text-slate-400">Are agents producing accepted output autonomously, at a reasonable cost?</p>
      </div>

      {/* Alerts strip */}
      {visibleAlerts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-lg border border-amber-800/40 bg-amber-950/20">
          <span className="text-xs font-medium text-amber-400">Alerts ({visibleAlerts.length})</span>
          {visibleAlerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-1.5">
              <AlertBadge severity={alert.severity} label={alert.type.replace(/_/g, ' ')} />
              <span className="text-xs text-slate-400">{alert.message}</span>
              <button
                onClick={() => dismissAlert(alert.id)}
                aria-label={`Dismiss alert: ${alert.message}`}
                className="ml-0.5 text-slate-500 hover:text-slate-300 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <Link
            to="/governance"
            className="ml-auto text-xs text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap"
          >
            View in Governance →
          </Link>
        </div>
      )}

      {/* Hero: AutonomyBar */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Agent Autonomy Breakdown</h2>
        <AutonomyBar breakdown={autonomyBreakdown} onBandClick={setActiveBand} activeBand={activeBand} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard title="Tasks Started" value={kpis.tasksStarted.value} format="number" trend={kpis.tasksStarted.trendPct} sparkline={kpis.tasksStarted.sparkline} />
        <KpiCard title="Autonomy Rate" value={kpis.autonomyRate.value} format="percent" trend={kpis.autonomyRate.trendPct} sparkline={kpis.autonomyRate.sparkline} tooltip="% of terminal tasks classified as autonomous (merged PR + <20% human edits)" />
        <KpiCard title="Cost/Merged PR" value={kpis.costPerMergedPr.value} format="currency" trend={kpis.costPerMergedPr.trendPct} sparkline={kpis.costPerMergedPr.sparkline} higherIsBetter={false} />
        <KpiCard title="Median Time to PR" value={kpis.medianTimeToPr.value} format="duration" trend={kpis.medianTimeToPr.trendPct} higherIsBetter={false} />
        <KpiCard title="Active Users" value={kpis.activeUsers.value} format="number" trend={kpis.activeUsers.trendPct} sparkline={kpis.activeUsers.sparkline} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">
            Tasks over time {activeBand ? `— ${activeBand.replace(/_/g, ' ')} only` : ''}
          </h2>
          <StackedAreaChart data={filteredOverTime} series={BAND_SERIES} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team comparison</h2>
          <ScatterChart data={teamScatter} highlightTeamId={teamId} />
        </div>
      </div>
    </div>
  )
}
