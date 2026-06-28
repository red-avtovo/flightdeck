import type { AutonomyBand, TaskStatus } from '../types'

export interface AutonomyInput {
  status: TaskStatus
  prMerged: boolean
  editDistancePct: number
  prReverted?: boolean
  humanInterventionRequired?: boolean
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs > 0 && abs < 0.01) {
    return `${sign}$${abs.toFixed(3)}`
  }
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) {
    const s = parseFloat(seconds.toFixed(1))
    return s === Math.floor(s) ? `${Math.floor(s)}s` : `${s}s`
  }
  const totalMinutes = Math.floor(seconds / 60)
  if (totalMinutes < 60) {
    const s = Math.round(seconds % 60)
    return `${totalMinutes}m ${s}s`
  }
  const totalHours = Math.floor(totalMinutes / 60)
  if (totalHours < 24) {
    const m = totalMinutes % 60
    return `${totalHours}h ${m}m`
  }
  const days = Math.floor(totalHours / 24)
  const h = totalHours % 24
  return `${days}d ${h}h`
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${parseFloat((n / 1_000_000).toFixed(1))}M`
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}K`
  return String(n)
}

export function formatPercent(ratio: number): string {
  const pct = ratio * 100
  if (pct === 100) return '100%'
  if (pct === 0) return '0%'
  return `${pct.toFixed(1)}%`
}

export function computeTrend(current: number, prior: number): number | null {
  if (prior === 0) return null
  return parseFloat((((current - prior) / prior) * 100).toFixed(1))
}

export function classifyAutonomy(input: AutonomyInput): AutonomyBand {
  const {
    status,
    prMerged,
    editDistancePct,
    prReverted = false,
    humanInterventionRequired = false,
  } = input
  if (status === 'failed' || status === 'cancelled' || !prMerged || prReverted) return 'failed'
  if (humanInterventionRequired || editDistancePct > 70) return 'human_rescued'
  if (editDistancePct >= 20) return 'human_assisted'
  return 'autonomous'
}

export function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.ceil((p / 100) * sortedAsc.length) - 1
  return sortedAsc[Math.max(0, Math.min(idx, sortedAsc.length - 1))]
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}
