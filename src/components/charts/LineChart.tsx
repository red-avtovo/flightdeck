import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface Series {
  key: string
  label: string
  color: string
}

interface LineChartProps {
  data: Record<string, string | number>[]
  series: Series[]
  height?: number
  xKey?: string
  className?: string
  formatY?: (v: number) => string
}

const DEFAULT_TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#f1f5f9',
}

export function LineChart({ data, series, height = 240, xKey = 'date', className = '', formatY }: LineChartProps) {
  if (data.length === 0) return <EmptyState />

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
          <Tooltip contentStyle={DEFAULT_TOOLTIP_STYLE} formatter={formatY ? (v: number) => [formatY(v)] : undefined} />
          {series.length > 1 && <Legend />}
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  )
}
