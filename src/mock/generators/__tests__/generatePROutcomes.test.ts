import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { SCENARIOS } from '../../scenario'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generatePROutcomes } from '../generatePROutcomes'
import { classifyAutonomy } from '../../../lib/utils'

describe('generatePROutcomes', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users, SCENARIOS.healthy.profile)
  const outcomes = generatePROutcomes(rng, tasks, repos, SCENARIOS.healthy.profile)

  it('only completed tasks with prId get an outcome', () => {
    const eligibleIds = new Set(tasks.filter(t => t.prId !== null).map(t => t.id))
    outcomes.forEach(o => expect(eligibleIds.has(o.taskId)).toBe(true))
  })

  it('humanEditDistancePct is between 0 and 100', () => {
    outcomes.forEach(o => {
      expect(o.humanEditDistancePct).toBeGreaterThanOrEqual(0)
      expect(o.humanEditDistancePct).toBeLessThanOrEqual(100)
    })
  })

  it('merged PRs have a non-null mergedAt', () => {
    outcomes.filter(o => o.status === 'merged').forEach(o => expect(o.mergedAt).not.toBeNull())
  })

  it('autonomyBand matches classifyAutonomy logic', () => {
    outcomes.forEach(o => {
      const task = tasks.find(t => t.id === o.taskId)!
      const expected = classifyAutonomy({
        status: o.status === 'merged' ? 'completed' : 'failed',
        prMerged: o.status === 'merged',
        editDistancePct: o.humanEditDistancePct,
        prReverted: o.status === 'reverted',
        humanInterventionRequired: task.humanInterventionRequired,
      })
      expect(o.autonomyBand).toBe(expected)
    })
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2, SCENARIOS.healthy.profile)
    expect(generatePROutcomes(rng2, tasks2, r2, SCENARIOS.healthy.profile)).toEqual(outcomes)
  })
})
