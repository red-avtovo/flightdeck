import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'
import { generateUsers } from '../generateUsers'
import { generateTasks } from '../generateTasks'
import { generateSpans } from '../generateSpans'

describe('generateSpans', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)
  const users = generateUsers(rng, teams)
  const tasks = generateTasks(rng, teams, repos, users)
  const spans = generateSpans(rng, tasks)

  it('each span has a taskId that exists in tasks', () => {
    const taskIds = new Set(tasks.map(t => t.id))
    spans.forEach(s => expect(taskIds.has(s.taskId)).toBe(true))
  })

  it('durationMs > 0 for all spans', () => {
    spans.forEach(s => expect(s.durationMs).toBeGreaterThan(0))
  })

  it('env_setup spans have source: operator', () => {
    const envSpans = spans.filter(s => s.type === 'env_setup')
    envSpans.forEach(s => expect(s.source).toBe('operator'))
  })

  it('non-env spans have source: agent', () => {
    const agentSpans = spans.filter(s => s.type !== 'env_setup')
    agentSpans.forEach(s => expect(s.source).toBe('agent'))
  })

  it('error spans have an errorCategory set', () => {
    const errorSpans = spans.filter(s => s.status === 'error' || s.status === 'timeout')
    errorSpans.forEach(s => expect(s.errorCategory).toBeTruthy())
  })

  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    const r2 = generateRepos(rng2, t2)
    const u2 = generateUsers(rng2, t2)
    const tasks2 = generateTasks(rng2, t2, r2, u2)
    expect(generateSpans(rng2, tasks2)).toEqual(spans)
  })
})
