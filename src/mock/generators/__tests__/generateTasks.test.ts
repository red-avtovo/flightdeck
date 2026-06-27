import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'

describe('generateTasks', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)

  it('returns between 800 and 1500 tasks', () => {
    expect(tasks.length).toBeGreaterThanOrEqual(800)
    expect(tasks.length).toBeLessThanOrEqual(1500)
  })

  it('all tasks have required string fields', () => {
    tasks.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.teamId).toBeTruthy()
      expect(t.repoId).toBeTruthy()
      expect(t.userId).toBeTruthy()
    })
  })

  it('startedAt dates span the 90-day window', () => {
    const now = new Date('2026-06-27').getTime()
    const ninetyDaysAgo = now - 90 * 86400000
    tasks.forEach(t => {
      const ts = new Date(t.startedAt).getTime()
      expect(ts).toBeGreaterThanOrEqual(ninetyDaysAgo)
      expect(ts).toBeLessThanOrEqual(now)
    })
  })

  it('weekday volume is at least 1.2x weekend volume', () => {
    const weekdayCount = tasks.filter(t => {
      const day = new Date(t.startedAt).getUTCDay()
      return day >= 1 && day <= 5
    }).length
    const weekendCount = tasks.filter(t => {
      const day = new Date(t.startedAt).getUTCDay()
      return day === 0 || day === 6
    }).length
    const weekdayPerDay = weekdayCount / (90 * 5 / 7)
    const weekendPerDay = weekendCount / (90 * 2 / 7)
    expect(weekdayPerDay / weekendPerDay).toBeGreaterThanOrEqual(1.2)
  })

  it('terminal tasks have autonomyBand null at generation time', () => {
    const terminal = tasks.filter(t =>
      t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled',
    )
    terminal.forEach(t => expect(t.autonomyBand).toBeNull())
  })

  it('non-terminal tasks have autonomyBand null', () => {
    const nonTerminal = tasks.filter(t => t.status === 'queued' || t.status === 'running')
    nonTerminal.forEach(t => expect(t.autonomyBand).toBeNull())
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    expect(generateTasks(rng2, t2, r2, u2)).toEqual(tasks)
  })
})
