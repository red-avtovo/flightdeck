import { useState } from 'react'
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { EmptyState } from '../ui/EmptyState'
import { ChartTooltip } from './ChartTooltip'

interface Series {
  key: string
  label: string
  color: string
}

interface LineChartProps {
  data: any[]
  series: Series[]
  height?: number
  xKey?: string
  className?: string
  formatY?: (v: number) => string
  /** Overlay a dashed least-squares trend line per series — useful for spotting
   *  direction across a noisy, many-point time series. */
  trend?: boolean
  /** Render an interactive legend whose chips toggle each series on/off. Use for
   *  many-series charts (e.g. errors by category) that are too busy to read at once. */
  toggleable?: boolean
}

const trendKey = (key: string) => `__trend_${key}`

// Least-squares linear fit over the series values (x = point index).
function linearTrend(values: number[]): number[] {
  const n = values.length
  if (n < 2) return values.slice()
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) {
    sx += i; sy += values[i]; sxy += i * values[i]; sxx += i * i
  }
  const denom = n * sxx - sx * sx
  if (denom === 0) return values.slice()
  const slope = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return values.map((_, i) => intercept + slope * i)
}

export function LineChart({ data, series, height = 240, xKey = 'date', className = '', formatY, trend = false, toggleable = false }: LineChartProps) {
  // Which series the user has toggled off via the interactive legend. Empty (and
  // unused) unless `toggleable`, so non-toggleable charts behave exactly as before.
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set())
  const toggle = (key: string) =>
    setHidden(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  if (data.length === 0) return <EmptyState />

  const chartData = trend
    ? (() => {
        const fits = Object.fromEntries(
          series.map(s => [s.key, linearTrend(data.map(d => Number(d[s.key]) || 0))]),
        )
        return data.map((d, i) => {
          const row: Record<string, unknown> = { ...d }
          series.forEach(s => { row[trendKey(s.key)] = fits[s.key][i] })
          return row
        })
      })()
    : data

  return (
    <div className={`w-full ${className}`}>
      {/* Interactive legend: click a chip to show/hide its series. Replaces the
          static Recharts <Legend> so a busy many-series chart can be thinned out. */}
      {toggleable && series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" role="group" aria-label="Toggle series">
          {series.map(s => {
            const on = !hidden.has(s.key)
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                aria-pressed={on}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  on ? 'text-slate-200 hover:text-white' : 'text-slate-400 line-through hover:text-slate-200'
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={on ? { backgroundColor: s.color } : { border: `1.5px solid ${s.color}` }}
                  aria-hidden="true"
                />
                {s.label}
              </button>
            )
          })}
        </div>
      )}
      <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3a3530" />
          <XAxis dataKey={xKey} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatY} />
          <Tooltip
            wrapperStyle={{ outline: 'none' }}
            content={<ChartTooltip formatValue={formatY} hideKey={k => k.startsWith('__trend_')} />}
          />
          {/* When toggleable, our own legend (above) drives visibility; otherwise use Recharts'. */}
          {!toggleable && series.length > 1 && <Legend />}
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} hide={hidden.has(s.key)} />
          ))}
          {trend && series.map(s => (
            <Line
              key={trendKey(s.key)}
              type="linear"
              dataKey={trendKey(s.key)}
              name={`${s.label} (trend)`}
              stroke={s.color}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              strokeOpacity={0.55}
              dot={false}
              activeDot={false}
              legendType="none"
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
