import {
  ScatterChart as ReScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import type { TeamMetrics } from '../../types'
import { formatNumber, formatPercent } from '../../lib/utils'

interface ScatterChartProps {
  data: TeamMetrics[]
  height?: number
  /** When set, that team's point is emphasised and the others are dimmed. */
  highlightTeamId?: string | null
}

interface PlotPoint {
  x: number
  y: number
  name: string
  teamId: string
}

// Quadrant labelling relative to the org-median cross. No ranking implied — this is a
// pattern view ("high volume / high autonomy" vs "low volume / low autonomy", etc.).
function quadrantLabel(x: number, y: number, medX: number, medY: number): string {
  const vol = x >= medX ? 'High volume' : 'Low volume'
  const aut = y >= medY ? 'high autonomy' : 'low autonomy'
  return `${vol} · ${aut}`
}

function makeTooltip(medX: number, medY: number) {
  return function ScatterTooltip({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload || payload.length === 0) return null
    const p = payload[0].payload as PlotPoint
    return (
      <div className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-slate-50 mb-1">{p.name}</p>
        <p className="text-slate-300">Task volume: <span className="tabular-nums text-slate-50">{formatNumber(p.x)}</span></p>
        <p className="text-slate-300">Autonomy rate: <span className="tabular-nums text-slate-50">{formatPercent(p.y)}</span></p>
        <p className="mt-1 text-slate-400">{quadrantLabel(p.x, p.y, medX, medY)}</p>
      </div>
    )
  }
}

export function ScatterChart({ data, height = 300, highlightTeamId = null }: ScatterChartProps) {
  if (data.length === 0) return <EmptyState />

  const orgMedianTasks = data.reduce((s, d) => s + d.taskCount, 0) / data.length
  const orgMedianAutonomy = data.reduce((s, d) => s + d.autonomyRate, 0) / data.length

  const plotData: PlotPoint[] = data.map(d => ({
    x: d.taskCount,
    y: d.autonomyRate,
    name: d.teamName,
    teamId: d.teamId,
  }))

  const hasHighlight = highlightTeamId !== null && plotData.some(p => p.teamId === highlightTeamId)
  const basePoints = hasHighlight ? plotData.filter(p => p.teamId !== highlightTeamId) : plotData
  const highlightPoints = hasHighlight ? plotData.filter(p => p.teamId === highlightTeamId) : []

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            dataKey="x"
            name="Task Volume"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            label={{ value: 'Task Volume', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Autonomy Rate"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => formatPercent(v)}
            label={{ value: 'Autonomy Rate', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip
            content={makeTooltip(orgMedianTasks, orgMedianAutonomy)}
            cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
          />
          {/* Median cross — splits teams into four quadrants */}
          <ReferenceLine
            x={orgMedianTasks}
            stroke="#64748b"
            strokeDasharray="5 4"
            label={{ value: 'Median volume', position: 'top', fill: '#64748b', fontSize: 10 }}
          />
          <ReferenceLine
            y={orgMedianAutonomy}
            stroke="#64748b"
            strokeDasharray="5 4"
            label={{ value: 'Median autonomy', position: 'insideRight', fill: '#64748b', fontSize: 10 }}
          />
          <Scatter
            data={basePoints}
            fill="#6366f1"
            fillOpacity={hasHighlight ? 0.3 : 1}
          />
          {highlightPoints.length > 0 && (
            <Scatter data={highlightPoints} fill="#f59e0b" shape="circle" />
          )}
        </ReScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
