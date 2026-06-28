import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface Series {
  key: string
  label: string
  color: string
}

interface BarChartProps {
  data: any[]
  series: Series[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  xKey?: string
  formatY?: (v: number) => string
  stacked?: boolean
  /** Set false for whole-count axes so ticks stay integers (e.g. task counts). */
  allowDecimals?: boolean
}

export function BarChart({ data, series, height = 240, layout = 'vertical', xKey = 'name', formatY, stacked = false, allowDecimals = true }: BarChartProps) {
  if (data.length === 0) return <EmptyState />

  const isHorizontal = layout === 'horizontal'

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 4, bottom: 4, left: isHorizontal ? 80 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={!isHorizontal} vertical={isHorizontal} />
          {isHorizontal ? (
            <>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} tickFormatter={formatY} allowDecimals={allowDecimals} />
              <YAxis type="category" dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={76} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} allowDecimals={allowDecimals} />
            </>
          )}
          <Tooltip
            wrapperStyle={{ outline: 'none' }}
            cursor={{ fill: '#33415533' }}
            content={<ChartTooltip formatValue={formatY} />}
          />
          {series.length > 1 && <Legend />}
          {series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'stack' : undefined} radius={series.length === 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}
