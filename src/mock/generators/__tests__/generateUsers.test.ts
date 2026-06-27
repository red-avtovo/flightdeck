import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'
import { generateUsers } from '../generateUsers'

describe('generateUsers', () => {
  const rng = createRng(42)
  const teams = generateTeams(rng)
  const users = generateUsers(rng, teams)

  it('returns exactly 12 users', () => expect(users).toHaveLength(12))
  it('each user belongs to a valid team', () => {
    const teamIds = new Set(teams.map(t => t.id))
    users.forEach(u => expect(teamIds.has(u.teamId)).toBe(true))
  })
  it('each user has name and email', () => {
    users.forEach(u => {
      expect(u.name).toBeTruthy()
      expect(u.email).toContain('@')
    })
  })
  it('is deterministic', () => {
    const rng2 = createRng(42)
    const t2 = generateTeams(rng2)
    expect(generateUsers(rng2, t2)).toEqual(users)
  })
})
