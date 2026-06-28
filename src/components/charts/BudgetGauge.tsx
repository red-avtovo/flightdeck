interface BudgetGaugeProps {
  spentUsd: number
  budgetUsd: number
}

type GaugeState = 'normal' | 'warning' | 'danger'

// Three-tier burn state. Danger (> 90%) is mandated by FR-04 ("turns red at > 90%");
// the amber warning band gives an early signal before the budget is blown.
const WARNING_THRESHOLD = 0.75
const DANGER_THRESHOLD = 0.9

const STATE_STYLES: Record<GaugeState, { arc: string; text: string; label: string }> = {
  normal:  { arc: '#10b981', text: 'text-emerald-400', label: '' },
  warning: { arc: '#f59e0b', text: 'text-amber-400',   label: 'Approaching budget' },
  danger:  { arc: '#f43f5e', text: 'text-rose-400',    label: 'Over budget' },
}

function gaugeState(pct: number): GaugeState {
  if (pct > DANGER_THRESHOLD) return 'danger'
  if (pct >= WARNING_THRESHOLD) return 'warning'
  return 'normal'
}

export function BudgetGauge({ spentUsd, budgetUsd }: BudgetGaugeProps) {
  const pct = budgetUsd > 0 ? spentUsd / budgetUsd : 0
  const state = gaugeState(pct)
  const styles = STATE_STYLES[state]
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
      aria-label={`Budget gauge: ${displayPct}% of budget used (${state})`}
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
          stroke={styles.arc}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          data-state={state}
        />
      </svg>
      <div className="-mt-6 text-center">
        <p className={`text-3xl font-bold tabular-nums ${styles.text}`}>
          {displayPct}%
        </p>
        {styles.label && (
          <p className={`text-xs font-medium mt-0.5 ${styles.text}`}>{styles.label}</p>
        )}
      </div>
    </div>
  )
}
