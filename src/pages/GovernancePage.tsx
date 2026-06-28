import { getGovernanceMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { StackedAreaChart } from '../components/charts/StackedAreaChart'
import { EventLog } from '../components/tables/EventLog'
import { Skeleton } from '../components/ui/Skeleton'

export default function GovernancePage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getGovernanceMetrics(period, teamId, model), [period, teamId, model])

  const EVENT_SERIES = [
    { key: 'policy_block',            label: 'Policy Block',    color: '#f43f5e' },
    { key: 'secret_detected',         label: 'Secret Detected', color: '#f59e0b' },
    { key: 'human_approval_required', label: 'Human Approval',  color: '#8b5cf6' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading governance">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const { kpis, eventsOverTime, events } = data

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Governance & Audit</h1>
        <p className="text-sm text-slate-400">Are agents operating within policy boundaries?</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Policy Blocks" value={kpis.policyBlocks.value} format="number" trend={kpis.policyBlocks.trendPct} higherIsBetter={false} />
        <KpiCard title="Secrets Detected" value={kpis.secretsDetected.value} format="number" trend={kpis.secretsDetected.trendPct} higherIsBetter={false} />
        <KpiCard title="Human Approvals" value={kpis.humanApprovalsRequired.value} format="number" trend={kpis.humanApprovalsRequired.trendPct} higherIsBetter={false} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Security events over time</h2>
        <StackedAreaChart data={eventsOverTime} series={EVENT_SERIES} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Event log</h2>
        <EventLog events={events} />
      </div>
    </div>
  )
}
