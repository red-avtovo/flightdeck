import type { AutonomyBand } from '../../types'

interface AutonomyBarProps {
  breakdown: Record<AutonomyBand, number>
  onBandClick?: (band: AutonomyBand | null) => void
  activeBand?: AutonomyBand | null
}

const BANDS: { key: AutonomyBand; label: string; color: string }[] = [
  { key: 'autonomous',     label: 'Autonomous',     color: 'bg-emerald-500' },
  { key: 'human_assisted', label: 'Human-assisted', color: 'bg-sky-500' },
  { key: 'human_rescued',  label: 'Human-rescued',  color: 'bg-amber-500' },
  { key: 'failed',         label: 'Failed',         color: 'bg-rose-500' },
]

export function AutonomyBar({ breakdown, onBandClick, activeBand }: AutonomyBarProps) {
  return (
    <div
      data-testid="autonomy-bar"
      role="img"
      aria-label={`Agent autonomy breakdown: ${Math.round(breakdown.autonomous * 100)}% autonomous`}
    >
      {/* Segmented bar */}
      <div className="flex w-full h-8 rounded-full overflow-hidden gap-0.5" role="group" aria-label="Autonomy segments">
        {BANDS.map(({ key, label, color }) => {
          const pct = (breakdown[key] * 100).toFixed(1)
          if (breakdown[key] === 0) return null
          return (
            <button
              key={key}
              className={`${color} transition-opacity ${activeBand && activeBand !== key ? 'opacity-40' : 'opacity-100'} focus:outline-none focus:ring-2 focus:ring-orange-500`}
              style={{ width: `${breakdown[key] * 100}%` }}
              onClick={() => onBandClick?.(activeBand === key ? null : key)}
              aria-label={`${label}: ${pct}%`}
              aria-pressed={activeBand === key}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {BANDS.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5 text-sm text-slate-300">
            <span className={`w-3 h-3 rounded-sm ${color} inline-block`} aria-hidden />
            <span>{label}</span>
            <span className="font-semibold tabular-nums text-slate-50">
              {(breakdown[key] * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
