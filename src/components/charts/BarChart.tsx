import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'

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
}

export function BarChart({ data, series, height = 240, layout = 'vertical', xKey = 'name', formatY, stacked = false }: BarChartProps) {
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
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} tickFormatter={formatY} />
              <YAxis type="category" dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={76} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
            </>
          )}
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} formatter={formatY ? (v: number) => [formatY(v)] : undefined} />
          {series.length > 1 && <Legend />}
          {series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} stackId={stacked ? 'stack' : undefined} radius={series.length === 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}
