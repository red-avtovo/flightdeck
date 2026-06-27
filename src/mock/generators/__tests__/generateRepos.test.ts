import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateRepos } from '../generateRepos'

describe('generateRepos', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const repos = generateRepos(rng, teams)

  it('returns exactly 5 repos', () => expect(repos).toHaveLength(5))
  it('each repo has valid teamId', () => {
    const teamIds = new Set(teams.map(t => t.id))
    repos.forEach(r => expect(teamIds.has(r.teamId)).toBe(true))
  })
  it('each repo has boolean readiness flags', () => {
    repos.forEach(r => {
      expect(typeof r.testCommandDetected).toBe('boolean')
      expect(typeof r.ciConfigured).toBe('boolean')
      expect(typeof r.agentInstructionsPresent).toBe('boolean')
    })
  })
  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    expect(generateRepos(rng2, t2)).toEqual(repos)
  })
})
