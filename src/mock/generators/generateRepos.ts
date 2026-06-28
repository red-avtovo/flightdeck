import type { Rng } from '../seed'
import type { Repo, Team } from '../../types'

// `protected` marks production-tier repos (customer-facing / core infra). Governance
// events here escalate in severity — a leaked secret or policy event matters more
// where it can reach production.
const REPO_DEFS = [
  { id: 'repo-platform-core', name: 'platform-core', teamIdx: 0, protected: true },
  { id: 'repo-product-web', name: 'product-web', teamIdx: 1, protected: true },
  { id: 'repo-ds-pipelines', name: 'ds-pipelines', teamIdx: 2, protected: false },
  { id: 'repo-mobile-app', name: 'mobile-app', teamIdx: 3, protected: false },
  { id: 'repo-shared-infra', name: 'shared-infra', teamIdx: 0, protected: true },
] as const

export function generateRepos(rng: Rng, teams: Team[]): Repo[] {
  return REPO_DEFS.map(def => ({
    id: def.id,
    name: def.name,
    teamId: teams[def.teamIdx].id,
    testCommandDetected: rng.nextBool(0.8),
    ciConfigured: rng.nextBool(0.9),
    agentInstructionsPresent: rng.nextBool(0.6),
    protected: def.protected,
  }))
}
