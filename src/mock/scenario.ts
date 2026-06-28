import type { TaskType } from '../types'

/** Which demo dataset to present. */
export type Scenario = 'healthy' | 'problematic'

/**
 * Tunable knobs the generators read so a single code path can produce either an
 * optimistic ("healthy") or a troubled ("problematic") fleet from the same seed.
 * Only thresholds/ranges/probabilities vary — never the number of RNG draws — so
 * each scenario stays deterministic and reproducible.
 */
export interface ScenarioProfile {
  /** Weights for [completed, cancelled, failed, queued, running]. */
  statusWeights: number[]
  /** P(a completed task opened a PR). */
  hasPrProb: number
  policyBlockProb: number
  humanInterventionProb: number
  /** Multiplier on token counts so spend reads in the thousands. */
  tokenScale: number
  /** Cumulative PR-status thresholds: < merged < closed_unmerged < open, else reverted. */
  prMergedThresh: number
  prClosedThresh: number
  prOpenThresh: number
  /** Human-edit-distance % range per task type (lower → more "autonomous"). */
  editDistanceRanges: Record<TaskType, [number, number]>
  ciFirstPassProb: number
  ciMergedPassProb: number
  /** Span failure probabilities (only ever applied to failed tasks). */
  envFailProb: number
  transientFailProb: number
  /** P(a security event is critical) — drives the alert count. */
  criticalEventProb: number
}

const HEALTHY: ScenarioProfile = {
  statusWeights: [0.93, 0.015, 0.015, 0.02, 0.02],
  hasPrProb: 0.98,
  policyBlockProb: 0.04,
  humanInterventionProb: 0.05,
  tokenScale: 300,
  prMergedThresh: 0.95,
  prClosedThresh: 0.97,
  prOpenThresh: 0.985,
  editDistanceRanges: {
    docs: [3, 15],
    feature: [10, 45],
    bug_fix: [5, 28],
    tests: [3, 12],
    refactor: [8, 32],
    dependency_update: [0, 8],
  },
  ciFirstPassProb: 0.92,
  ciMergedPassProb: 0.97,
  envFailProb: 0.1,
  transientFailProb: 0.08,
  criticalEventProb: 0.08,
}

// The original pessimistic distribution — useful to show how the dashboard reads
// when the fleet is struggling (high failure/edit-distance, frequent alerts).
const PROBLEMATIC: ScenarioProfile = {
  statusWeights: [0.7, 0.15, 0.1, 0.03, 0.02],
  hasPrProb: 0.85,
  policyBlockProb: 0.08,
  humanInterventionProb: 0.12,
  tokenScale: 300,
  prMergedThresh: 0.72,
  prClosedThresh: 0.84,
  prOpenThresh: 0.92,
  editDistanceRanges: {
    docs: [5, 25],
    feature: [25, 80],
    bug_fix: [10, 50],
    tests: [5, 20],
    refactor: [15, 60],
    dependency_update: [0, 10],
  },
  ciFirstPassProb: 0.78,
  ciMergedPassProb: 0.9,
  envFailProb: 0.15,
  transientFailProb: 0.12,
  criticalEventProb: 0.15,
}

export const SCENARIOS: Record<Scenario, { label: string; profile: ScenarioProfile }> = {
  healthy: { label: 'Healthy', profile: HEALTHY },
  problematic: { label: 'Problematic', profile: PROBLEMATIC },
}

export const DEFAULT_SCENARIO: Scenario = 'healthy'

/**
 * Demo workspaces shown on the login screen. Picking a company selects which
 * scenario (and org name) the dashboard presents for the session.
 */
export interface Company {
  id: string
  name: string
  scenario: Scenario
  blurb: string
}

export const COMPANIES: Company[] = [
  { id: 'acme', name: 'Acme Corp', scenario: 'healthy', blurb: 'A high-performing agent fleet — autonomy up, costs in budget' },
  { id: 'globex', name: 'Globex Industries', scenario: 'problematic', blurb: 'A fleet under strain — low merge rate, frequent alerts' },
]

export const DEFAULT_COMPANY: Company = COMPANIES[0]
