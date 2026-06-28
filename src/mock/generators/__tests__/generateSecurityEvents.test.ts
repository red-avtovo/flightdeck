import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { SCENARIOS } from '../../scenario'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generateSecurityEvents } from '../generateSecurityEvents'

describe('generateSecurityEvents', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users, SCENARIOS.healthy.profile)
  const events = generateSecurityEvents(rng, tasks, repos, SCENARIOS.healthy.profile)

  it('includes all three event types', () => {
    const types = new Set(events.map(e => e.type))
    expect(types.has('policy_block')).toBe(true)
    expect(types.has('secret_detected')).toBe(true)
    expect(types.has('human_approval_required')).toBe(true)
  })

  it('has at least one critical severity event', () => {
    expect(events.some(e => e.severity === 'critical')).toBe(true)
  })

  it('derives severity from category + repo — not at random', () => {
    const protectedIds = new Set(repos.filter(r => r.protected).map(r => r.id))
    // Human approvals are a routine gate — never critical.
    expect(events.filter(e => e.type === 'human_approval_required').every(e => e.severity !== 'critical')).toBe(true)
    // Critical is reserved for a secret exposed on a protected (production) repo.
    expect(
      events.filter(e => e.severity === 'critical').every(e => e.type === 'secret_detected' && protectedIds.has(e.repoId)),
    ).toBe(true)
    // Nothing on a non-protected repo is critical.
    expect(events.filter(e => !protectedIds.has(e.repoId)).every(e => e.severity !== 'critical')).toBe(true)
  })

  it('all events have a valid taskId', () => {
    const taskIds = new Set(tasks.map(t => t.id))
    events.forEach(e => expect(taskIds.has(e.taskId)).toBe(true))
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2, SCENARIOS.healthy.profile)
    expect(generateSecurityEvents(rng2, tasks2, r2, SCENARIOS.healthy.profile)).toEqual(events)
  })
})
