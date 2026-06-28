import {
  AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface AreaChartProps {
  data: any[]
  dataKey: string
  color?: string
  height?: number
  formatY?: (v: number) => string
}

export function AreaChart({ data, dataKey, color = '#6366f1', height = 240, formatY }: AreaChartProps) {
  if (data.length === 0) return <EmptyState />

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReAreaChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3530" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
          {/* Reuse shared tooltip formatter so values aren't raw floats — tooltip and axis use the same formatter. */}
          <Tooltip content={<ChartTooltip formatValue={formatY} />} />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#grad-${dataKey})`} dot={false} />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
