import { useState } from 'react'
import { getReliabilityMetrics, getTaskList, getTaskSpans } from '../mock/api'
import { useFilters } from '../hooks/useFilters'
import { useMockData } from '../hooks/useMockData'
import { KpiCard } from '../components/cards/KpiCard'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { ToolTable } from '../components/tables/ToolTable'
import { TaskList } from '../components/tables/TaskList'
import { SpanDrawer } from '../components/overlays/SpanDrawer'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDuration, formatPercent } from '../lib/utils'
import type { AgentTask, TraceSpan } from '../types'

export default function ReliabilityPage() {
  const { period, teamId, model } = useFilters()
  const { data, loading } = useMockData(() => getReliabilityMetrics(period, teamId, model), [period, teamId, model])
  const { data: tasks, loading: tasksLoading } = useMockData(
    () => getTaskList({ period, teamId: teamId ?? undefined, model: model ?? undefined }),
    [period, teamId, model],
  )

  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null)
  const [spans, setSpans] = useState<TraceSpan[]>([])
  const [spansLoading, setSpansLoading] = useState(false)

  async function handleTaskClick(task: AgentTask) {
    setSelectedTask(task)
    setSpansLoading(true)
    const result = await getTaskSpans(task.id)
    setSpans(result)
    setSpansLoading(false)
  }

  const ERROR_CATEGORIES = ['tool_error', 'timeout', 'env_setup', 'policy_block', 'model_error', 'test_failure'] as const
  const CATEGORY_COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#e879f9', '#0ea5e9', '#10b981']
  const errorSeries = ERROR_CATEGORIES.map((cat, i) => ({
    key: cat,
    label: cat.replace(/_/g, ' '),
    color: CATEGORY_COLORS[i],
  }))

  const durationSeries = [
    { key: 'p50', label: 'P50', color: '#6366f1' },
    { key: 'p95', label: 'P95', color: '#f43f5e' },
  ]

  if (loading || !data) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading reliability">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  const { kpis, durationTrend, errorRateByCategory, toolPerformance } = data

  const toolLeaderboard = [...toolPerformance]
    .sort((a, b) => b.errorRate - a.errorRate)
    .map(t => ({ name: t.tool.replace(/_/g, ' '), errorRate: t.errorRate }))
  const leaderboardSeries = [{ key: 'errorRate', label: 'Error Rate', color: '#f43f5e' }]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="sr-only">Reliability & Traces</h1>
        <p className="text-sm text-slate-400">Are agents healthy? Where do they fail and why?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="P95 Task Duration" value={kpis.p95TaskDurationMs.value} format="duration" trend={kpis.p95TaskDurationMs.trendPct} higherIsBetter={false} />
        <KpiCard title="Tool Failure Rate" value={kpis.toolFailureRate.value} format="percent" trend={kpis.toolFailureRate.trendPct} higherIsBetter={false} />
        <KpiCard title="Timeout Rate" value={kpis.timeoutRate.value} format="percent" trend={kpis.timeoutRate.trendPct} higherIsBetter={false} />
        <KpiCard title="Env Setup P95" value={kpis.envSetupP95Ms.value} format="duration" trend={kpis.envSetupP95Ms.trendPct} tooltip="P95 of operator-provisioned env_setup spans" higherIsBetter={false} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Task duration P50 / P95</h2>
          <LineChart data={durationTrend} series={durationSeries} formatY={formatDuration} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Errors by category</h2>
          {/* Absolute error counts per category per day (not a rate); format as integers */}
          <LineChart data={errorRateByCategory} series={errorSeries} formatY={v => String(Math.round(v))} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Tool reliability leaderboard</h2>
          <BarChart data={toolLeaderboard} series={leaderboardSeries} layout="horizontal" xKey="name" height={220} formatY={v => formatPercent(v)} />
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Tool performance</h2>
          <ToolTable rows={toolPerformance} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-4">Recent tasks (click to view spans)</h2>
        <TaskList tasks={(tasks ?? []).slice(0, 50)} onTaskClick={handleTaskClick} loading={tasksLoading} />
      </div>

      <SpanDrawer
        open={selectedTask !== null}
        taskId={selectedTask?.id ?? ''}
        spans={spans}
        onClose={() => { setSelectedTask(null); setSpans([]) }}
        loading={spansLoading}
      />
    </div>
  )
}
