import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  computeTrend,
  classifyAutonomy,
  percentile,
  isoDate,
} from '../utils'

describe('formatCurrency', () => {
  it('formats zero', () => expect(formatCurrency(0)).toBe('$0.00'))
  it('formats thousands', () => expect(formatCurrency(1234.5)).toBe('$1,234.50'))
  it('formats sub-cent', () => expect(formatCurrency(0.001)).toBe('$0.001'))
  it('formats negative', () => expect(formatCurrency(-50)).toBe('-$50.00'))
})

describe('formatDuration', () => {
  it('shows ms below 1000', () => expect(formatDuration(500)).toBe('500ms'))
  it('shows seconds for 1000–59999ms', () => expect(formatDuration(1500)).toBe('1.5s'))
  it('shows minutes and seconds', () => expect(formatDuration(90000)).toBe('1m 30s'))
  it('shows whole seconds', () => expect(formatDuration(2000)).toBe('2s'))
})

describe('formatNumber', () => {
  it('passes through below 1000', () => expect(formatNumber(999)).toBe('999'))
  it('formats thousands as K', () => expect(formatNumber(1000)).toBe('1K'))
  it('formats millions as M', () => expect(formatNumber(1_500_000)).toBe('1.5M'))
})

describe('formatPercent', () => {
  it('rounds to one decimal', () => expect(formatPercent(0.9532)).toBe('95.3%'))
  it('handles 100%', () => expect(formatPercent(1.0)).toBe('100%'))
  it('handles 0%', () => expect(formatPercent(0)).toBe('0%'))
})

describe('computeTrend', () => {
  it('returns positive % for increase', () => expect(computeTrend(100, 80)).toBeCloseTo(25.0))
  it('returns negative % for decrease', () => expect(computeTrend(80, 100)).toBeCloseTo(-20.0))
  it('returns null when prior is 0', () => expect(computeTrend(100, 0)).toBeNull())
})

describe('classifyAutonomy', () => {
  it('autonomous: merged + edit < 20%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 10 })).toBe('autonomous'))
  it('human_assisted: merged + edit 20–70%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 45 })).toBe('human_assisted'))
  it('human_rescued: merged + edit > 70%', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 80 })).toBe('human_rescued'))
  it('human_rescued: humanInterventionRequired overrides edit distance', () =>
    expect(
      classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 10, humanInterventionRequired: true }),
    ).toBe('human_rescued'))
  it('failed: task status failed', () =>
    expect(classifyAutonomy({ status: 'failed', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('failed: task status cancelled', () =>
    expect(classifyAutonomy({ status: 'cancelled', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('failed: PR reverted', () =>
    expect(
      classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 5, prReverted: true }),
    ).toBe('failed'))
  it('failed: no PR', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: false, editDistancePct: 0 })).toBe('failed'))
  it('boundary: edit distance exactly 20% → human_assisted', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 20 })).toBe('human_assisted'))
  it('boundary: edit distance exactly 70% → human_assisted', () =>
    expect(classifyAutonomy({ status: 'completed', prMerged: true, editDistancePct: 70 })).toBe('human_assisted'))
})

describe('percentile', () => {
  it('returns P50 of sorted array', () => {
    const sorted = [1, 2, 3, 4, 5]
    expect(percentile(sorted, 50)).toBe(3)
  })
  it('returns P95 of sorted array', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(percentile(sorted, 95)).toBe(95)
  })
})

describe('isoDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const d = new Date('2025-06-15T10:30:00Z')
    expect(isoDate(d)).toBe('2025-06-15')
  })
})
