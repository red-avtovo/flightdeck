import { describe, it, expect } from 'vitest'
import { createRng } from '../seed'

describe('createRng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(
      Array.from({ length: 20 }, () => b.next()),
    )
  })

  it('produces different sequences for different seeds', () => {
    const a = createRng(42)
    const b = createRng(99)
    const seqA = Array.from({ length: 10 }, () => a.next())
    const seqB = Array.from({ length: 10 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('next() returns values in [0, 1)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 1000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('nextInt returns integers in [min, max]', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const v = rng.nextInt(1, 10)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
    }
  })

  it('nextFloat returns floats in [min, max)', () => {
    const rng = createRng(42)
    for (let i = 0; i < 500; i++) {
      const v = rng.nextFloat(5, 15)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThan(15)
    }
  })

  it('pick selects an element from the array', () => {
    const rng = createRng(42)
    const arr = ['a', 'b', 'c'] as const
    for (let i = 0; i < 200; i++) {
      expect(arr).toContain(rng.pick(arr))
    }
  })

  it('nextBool defaults to ~50% true', () => {
    const rng = createRng(42)
    const trueCount = Array.from({ length: 1000 }, () => rng.nextBool()).filter(Boolean).length
    expect(trueCount).toBeGreaterThan(400)
    expect(trueCount).toBeLessThan(600)
  })

  it('nextBool(0.9) returns true ~90% of the time', () => {
    const rng = createRng(42)
    const trueCount = Array.from({ length: 1000 }, () => rng.nextBool(0.9)).filter(Boolean).length
    expect(trueCount).toBeGreaterThan(850)
  })

  it('logNormal returns positive values', () => {
    const rng = createRng(42)
    for (let i = 0; i < 100; i++) {
      expect(rng.logNormal(7, 0.5)).toBeGreaterThan(0)
    }
  })
})
