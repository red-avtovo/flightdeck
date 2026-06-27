import type { Rng } from '../seed'
import type { Team, User } from '../../types'

const USER_NAMES = [
  'Alex Chen', 'Maria Garcia', 'James Wilson', 'Sarah Kim',
  'David Patel', 'Emma Roberts', 'Michael Zhang', 'Olivia Brown',
  'Noah Martinez', 'Ava Thompson', 'Liam Johnson', 'Isabella Davis',
]

export function generateUsers(rng: Rng, teams: Team[]): User[] {
  const now = new Date('2026-06-27')

  return USER_NAMES.map((name, i) => {
    const team = teams[i % teams.length]
    const firstActiveDaysAgo = rng.nextInt(20, 90)
    const lastActiveDaysAgo = rng.nextInt(0, firstActiveDaysAgo)
    const firstActive = new Date(now.getTime() - firstActiveDaysAgo * 86400000)
    const lastActive = new Date(now.getTime() - lastActiveDaysAgo * 86400000)
    const slug = name.toLowerCase().replace(' ', '.')
    return {
      id: `user-${i + 1}`,
      teamId: team.id,
      name,
      email: `${slug}@acme.example`,
      firstActive: firstActive.toISOString(),
      lastActive: lastActive.toISOString(),
    }
  })
}
