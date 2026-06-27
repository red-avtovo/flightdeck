import type { Rng } from '../seed'
import type { Team } from '../../types'

const TEAM_DEFINITIONS = [
  { id: 'team-platform', name: 'Platform', memberCount: 8 },
  { id: 'team-product', name: 'Product', memberCount: 6 },
  { id: 'team-datascience', name: 'Data Science', memberCount: 5 },
  { id: 'team-mobile', name: 'Mobile', memberCount: 4 },
] as const

export function generateTeams(_rng: Rng): Team[] {
  return TEAM_DEFINITIONS.map(d => ({ ...d }))
}
