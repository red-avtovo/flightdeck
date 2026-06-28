import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

interface Series {
  key: string
  label: string
  color: string
}

interface StackedAreaChartProps {
  data: any[]
  series: Series[]
  height?: number
  /** How to format Y-axis ticks and tooltip values. Defaults to absolute counts. */
  valueFormat?: 'number' | 'percent'
}

export function StackedAreaChart({ data, series, height = 240, valueFormat = 'number' }: StackedAreaChartProps) {
  if (data.length === 0) return <EmptyState />

  const formatValue = (v: number) =>
    valueFormat === 'percent' ? `${(v * 100).toFixed(0)}%` : `${v}`

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3530" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatValue} />
          <Tooltip
            contentStyle={{ backgroundColor: '#252220', border: '1px solid #3a3530', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value: number) => formatValue(value)}
          />
          <Legend />
          {series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stackId="1" stroke={s.color} fill={s.color} fillOpacity={0.6} dot={false} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
