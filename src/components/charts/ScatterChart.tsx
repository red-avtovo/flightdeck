import {
  ScatterChart as ReScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import type { TeamMetrics } from '../../types'
import { formatPercent } from '../../lib/utils'

interface ScatterChartProps {
  data: TeamMetrics[]
  height?: number
}

export function ScatterChart({ data, height = 300 }: ScatterChartProps) {
  if (data.length === 0) return <EmptyState />

  const orgMedianTasks = data.reduce((s, d) => s + d.taskCount, 0) / data.length
  const orgMedianAutonomy = data.reduce((s, d) => s + d.autonomyRate, 0) / data.length

  const plotData = data.map(d => ({
    x: d.taskCount,
    y: d.autonomyRate,
    name: d.teamName,
  }))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            cursor={{ strokeDasharray: '3 3' }}
            formatter={(value, name) => name === 'y' ? [formatPercent(value as number), 'Autonomy Rate'] : [value, 'Task Volume']}
          />
          <ReferenceLine x={orgMedianTasks} stroke="#334155" strokeDasharray="4 4" />
          <ReferenceLine y={orgMedianAutonomy} stroke="#334155" strokeDasharray="4 4" />
          <Scatter data={plotData} fill="#6366f1" />
        </ReScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
