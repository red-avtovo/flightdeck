import type { Rng } from '../seed'
import type { Repo, Team } from '../../types'

const REPO_DEFS = [
  { id: 'repo-platform-core', name: 'platform-core', teamIdx: 0 },
  { id: 'repo-product-web', name: 'product-web', teamIdx: 1 },
  { id: 'repo-ds-pipelines', name: 'ds-pipelines', teamIdx: 2 },
  { id: 'repo-mobile-app', name: 'mobile-app', teamIdx: 3 },
  { id: 'repo-shared-infra', name: 'shared-infra', teamIdx: 0 },
] as const

export function generateRepos(rng: Rng, teams: Team[]): Repo[] {
  return REPO_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    teamId: teams[def.teamIdx].id,
    testCommandDetected: rng.nextBool(0.8),
    ciConfigured: rng.nextBool(0.9),
    agentInstructionsPresent: rng.nextBool(0.6),
  }))
}
