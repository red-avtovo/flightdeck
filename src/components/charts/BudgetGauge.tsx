interface BudgetGaugeProps {
  spentUsd: number
  budgetUsd: number
}

export function BudgetGauge({ spentUsd, budgetUsd }: BudgetGaugeProps) {
  const pct = budgetUsd > 0 ? spentUsd / budgetUsd : 0
  const isDanger = pct > 0.9
  const displayPct = Math.round(pct * 100)

  const cx = 80
  const cy = 80
  const r = 64
  const strokeWidth = 12
  const circumference = Math.PI * r
  // Half-circle arc (top half)
  const filled = Math.min(pct, 1) * circumference

  return (
    <div
      className="flex flex-col items-center"
      role="img"
      aria-label={`Budget gauge: ${displayPct}% of budget used`}
    >
      <svg width={160} height={100} viewBox="0 0 160 100">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={isDanger ? '#f43f5e' : '#6366f1'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          data-danger={isDanger ? 'true' : undefined}
        />
      </svg>
      <div className="-mt-6 text-center">
        <p className={`text-3xl font-bold tabular-nums ${isDanger ? 'text-rose-400' : 'text-slate-50'}`}>
          {displayPct}%
        </p>
        {isDanger && (
          <p className="text-xs text-rose-400 font-medium mt-0.5">Over budget</p>
        )}
      </div>
    </div>
  )
}
