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

  // Arc sized so the big percentage sits inside the bowl with breathing room — a
  // tighter radius made the number collide with the arc on every side.
  const cx = 90
  const cy = 90
  const r = 78
  const strokeWidth = 14
  const circumference = Math.PI * r
  // Half-circle arc (top half). cy = r + strokeWidth/2 keeps the round cap inside the viewBox.
  const filled = Math.min(pct, 1) * circumference
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <div
      className="relative flex flex-col items-center"
      role="img"
      aria-label={`Budget gauge: ${displayPct}% of budget used (${state})`}
    >
      <svg width={180} height={97} viewBox="0 0 180 97">
        {/* Track */}
        <path d={arc} fill="none" stroke="#252220" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Filled arc */}
        <path
          d={arc}
          fill="none"
          stroke={styles.arc}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          data-state={state}
        />
      </svg>
      {/* The percentage sits low — resting at the base of the bowl — and stays put across
          states. The optional state label is tucked ABOVE it in the upper part of the arch
          rather than below, where it used to crowd the arc's legs. */}
      {styles.label && (
        <p className={`absolute inset-x-0 top-[28px] text-center text-xs font-medium ${styles.text}`}>
          {styles.label}
        </p>
      )}
      <p className={`absolute inset-x-0 top-[53px] text-center text-3xl font-bold tabular-nums ${styles.text}`}>
        {displayPct}%
      </p>
    </div>
  )
}
