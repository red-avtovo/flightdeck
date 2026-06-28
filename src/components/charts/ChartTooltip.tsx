import type { TooltipProps } from 'recharts'

interface ChartTooltipProps extends TooltipProps<number, string> {
  /** Formats each numeric value (shared with the axis formatter). */
  formatValue?: (v: number) => string
  /** Hide payload entries whose dataKey matches — e.g. dashed trend overlays. */
  hideKey?: (key: string) => boolean
}

/**
 * Dark, legend-style tooltip shared by the line/bar charts: a header (the x value)
 * plus one colour-swatched row per series showing its label and formatted value —
 * not a bare number.
 */
export function ChartTooltip({ active, payload, label, formatValue, hideKey }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const rows = payload.filter(p => !(hideKey && hideKey(String(p.dataKey ?? ''))))
  if (rows.length === 0) return null

  return (
    <div className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs shadow-lg">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-semibold text-slate-50">{label}</p>
      )}
      <ul className="space-y-0.5">
        {rows.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-sm"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            />
            <span className="text-slate-300">{p.name}</span>
            <span className="ml-auto pl-3 tabular-nums text-slate-50">
              {formatValue ? formatValue(Number(p.value)) : p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
