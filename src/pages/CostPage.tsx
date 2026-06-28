import { getCostMetrics } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { AreaChart } from '../components/charts/AreaChart'
import { BudgetGauge } from '../components/charts/BudgetGauge'
import { BarChart } from '../components/charts/BarChart'
import { Skeleton } from '../components/ui/Skeleton'
import { formatCurrency, formatPercent } from '../lib/utils'
import type { TeamMetrics } from '../types'

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
  const { data, loading } = useMockData(() => getCostMetrics(period, teamId, model), [period, teamId, model])

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

  const { kpis, spendTrend, spentUsd, budgetUsd, costPerMergedPrByTaskType, teamBreakdown } = data
  const remainingUsd = Math.max(0, budgetUsd - spentUsd)

  const costByType = costPerMergedPrByTaskType
    .filter(d => d.costUsd > 0)
    .sort((a, b) => b.costUsd - a.costUsd)
    .map(d => ({ name: d.taskType.replace(/_/g, ' '), costUsd: d.costUsd }))

  const costSeries = [{ key: 'costUsd', label: 'Cost/Merged PR', color: '#6366f1' }]

  return (
    <div className="space-y-8">
      <div>
        {/* Title is sr-only: the TopBar already shows it visibly; keep the h1 for a11y/heading order. */}
        <h1 className="sr-only">Cost & Efficiency</h1>
        <p className="text-sm text-slate-400">Are we spending wisely on agent tasks?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Spend" value={kpis.totalSpend.value} format="currency" trend={kpis.totalSpend.trendPct} sparkline={kpis.totalSpend.sparkline} higherIsBetter={false} />
        <KpiCard title="Cost/Task" value={kpis.costPerTask.value} format="currency" trend={kpis.costPerTask.trendPct} higherIsBetter={false} />
        <KpiCard title="Cost/Merged PR" value={kpis.costPerMergedPr.value} format="currency" trend={kpis.costPerMergedPr.trendPct} higherIsBetter={false} />
        <KpiCard title="Token Waste" value={kpis.tokenWastePct.value} format="percent" trend={kpis.tokenWastePct.trendPct} tooltip="Tokens spent on tasks that produced no merged PR" higherIsBetter={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Spend over time</h2>
          <AreaChart data={spendTrend} dataKey="value" formatY={formatCurrency} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 flex flex-col">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400">Monthly budget</h2>
          {/* This card is about budget *posture*, not the spend amount — the Total Spend
              KPI already owns that figure, so we don't reprint it here (it was showing
              3× on one screen). Caption frames the % against the budget; the footer adds
              budget-specific context (what's left, the daily run-rate). */}
          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <BudgetGauge spentUsd={spentUsd} budgetUsd={budgetUsd} />
            <p className="mt-2 text-xs text-slate-400">of {formatCurrency(budgetUsd)} monthly budget</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t border-slate-700 pt-4 text-center">
            <div>
              <dt className="text-xs text-slate-400">Remaining</dt>
              <dd className="text-sm font-semibold tabular-nums text-slate-100">{formatCurrency(remainingUsd)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Avg / day</dt>
              <dd className="text-sm font-semibold tabular-nums text-slate-100">{formatCurrency(spentUsd / 30)}</dd>
            </div>
          </dl>
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

