import { describe, it, expect } from 'vitest'
import { createRng } from '../../seed'
import { generateTeams } from '../generateTeams'

describe('generateTeams', () => {
  it('returns exactly 4 teams', () => {
    expect(generateTeams(createRng(42))).toHaveLength(4)
  })
  it('each team has id, name, memberCount', () => {
    const teams = generateTeams(createRng(42))
    teams.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.name).toBeTruthy()
      expect(t.memberCount).toBeGreaterThan(0)
    })
  })
  it('is deterministic', () => {
    expect(generateTeams(createRng(42))).toEqual(generateTeams(createRng(42)))
  })
  it('team names include Platform, Product, Data Science, Mobile', () => {
    const names = generateTeams(createRng(42)).map(t => t.name)
    expect(names).toContain('Platform')
    expect(names).toContain('Product')
    expect(names).toContain('Data Science')
    expect(names).toContain('Mobile')
  })
})
