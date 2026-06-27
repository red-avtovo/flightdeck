import { SparklineChart } from '../charts/SparklineChart'
import { formatCurrency, formatDuration, formatNumber, formatPercent } from '../../lib/utils'
import type { TrendPoint } from '../../types'

interface KpiCardProps {
  title: string
  value: number
  format: 'number' | 'percent' | 'currency' | 'duration'
  trend: number | null
  sparkline?: TrendPoint[]
  tooltip?: string
  loading?: boolean
}

function formatValue(value: number, format: KpiCardProps['format']): string {
  switch (format) {
    case 'percent':  return formatPercent(value)
    case 'currency': return formatCurrency(value)
    case 'duration': return formatDuration(value)
    default:         return formatNumber(value)
  }
}

export function KpiCard({ title, value, format, trend, sparkline = [], tooltip, loading = false }: KpiCardProps) {
  if (loading) {
    return (
      <div
        className="rounded-lg bg-slate-800 border border-slate-700 p-4 space-y-3"
        role="status"
        aria-label={`Loading ${title}`}
      >
        <div className="h-3 w-24 rounded bg-slate-700 animate-pulse" />
        <div className="h-8 w-20 rounded bg-slate-700 animate-pulse" />
        <div className="h-2 w-16 rounded bg-slate-700 animate-pulse" />
      </div>
    )
  }

  const trendPositive = trend !== null && trend >= 0
  const trendColor = trendPositive ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div
      className="rounded-lg bg-slate-800 border border-slate-700 p-4 flex flex-col gap-2"
      title={tooltip}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-bold tabular-nums text-slate-50 leading-none">
          {formatValue(value, format)}
        </p>
        {sparkline.length > 1 && (
          <SparklineChart data={sparkline} className="text-slate-500" />
        )}
      </div>

      {trend !== null && (
        <p className={`text-xs font-medium ${trendColor}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% vs prior period
        </p>
      )}
    </div>
  )
}
