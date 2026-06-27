import { getCostMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { AreaChart } from '../components/charts/AreaChart'
import { BudgetGauge } from '../components/charts/BudgetGauge'
import { BarChart } from '../components/charts/BarChart'
import { TeamTable } from '../components/tables/TeamTable'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'
import type { TeamMetrics } from '../types'

const MONTHLY_BUDGET_USD = 50_000

function TeamCostSummary({ rows }: { rows: TeamMetrics[] }) {
  const thClass = 'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-400'
  const tdClass = 'px-3 py-2 text-sm text-slate-300 whitespace-nowrap'

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full">
        <thead className="bg-slate-800">
          <tr>
            <th className={thClass}>Team</th>
            <th className={thClass}>Spend</th>
            <th className={thClass}>Tasks</th>
            <th className={thClass}>$/Task</th>
            <th className={thClass}>$/Merged PR</th>
            <th className={thClass}>Waste %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map(row => (
            <tr key={row.teamId} className="hover:bg-slate-800/50 transition-colors">
              <td className={`${tdClass} font-medium text-slate-50`}>{row.teamName}</td>
              <td className={tdClass}>{formatCurrency(row.spendUsd)}</td>
              <td className={tdClass}>{row.taskCount}</td>
              <td className={tdClass}>{formatCurrency(row.costPerTask)}</td>
              <td className={tdClass}>{formatCurrency(row.costPerMergedPr)}</td>
              <td className={tdClass}>{formatPercent(row.tokenWastePct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CostPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getCostMetrics(period), [period, teamId, model])

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading cost">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  const { kpis, spendTrend, budgetBurnPct, costPerMergedPrByTaskType, teamBreakdown } = data
  const spentUsd = budgetBurnPct * MONTHLY_BUDGET_USD

  const costByType = costPerMergedPrByTaskType
    .filter(d => d.costUsd > 0)
    .sort((a, b) => b.costUsd - a.costUsd)
    .map(d => ({ name: d.taskType.replace(/_/g, ' '), costUsd: d.costUsd }))

  const costSeries = [{ key: 'costUsd', label: 'Cost/Merged PR', color: '#6366f1' }]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Cost & Efficiency</h1>
        <p className="text-sm text-slate-400">Are we spending wisely on agent tasks?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Spend" value={kpis.totalSpend.value} format="currency" trend={kpis.totalSpend.trendPct} sparkline={kpis.totalSpend.sparkline} />
        <KpiCard title="Cost/Task" value={kpis.costPerTask.value} format="currency" trend={kpis.costPerTask.trendPct} />
        <KpiCard title="Cost/Merged PR" value={kpis.costPerMergedPr.value} format="currency" trend={kpis.costPerMergedPr.trendPct} />
        <KpiCard title="Token Waste" value={kpis.tokenWastePct.value} format="percent" trend={kpis.tokenWastePct.trendPct} tooltip="Tokens spent on tasks that produced no merged PR" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Spend over time</h2>
          <AreaChart data={spendTrend} dataKey="value" formatY={formatCurrency} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex flex-col items-center">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4 self-start">Monthly budget</h2>
          <BudgetGauge spentUsd={spentUsd} budgetUsd={MONTHLY_BUDGET_USD} />
          <p className="mt-2 text-xs text-slate-400">{formatCurrency(spentUsd)} of {formatCurrency(MONTHLY_BUDGET_USD)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Cost/merged PR by task type</h2>
        <BarChart data={costByType} series={costSeries} layout="horizontal" xKey="name" height={220} formatY={formatCurrency} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Team cost breakdown</h2>
        <TeamCostSummary rows={teamBreakdown} />
      </div>
    </div>
  )
}

