import type { Rng } from '../seed'
import type { ScenarioProfile } from '../scenario'
import type { AgentTask, Repo, SecurityEvent, SecurityEventType, Severity } from '../../types'

const EVENT_TYPES: SecurityEventType[] = ['policy_block', 'secret_detected', 'human_approval_required']

/**
 * Severity is DERIVED from the event category and where it happened — not random.
 * The three severities are fixed; as governance coverage grows, new categories slot
 * into this table (and anything unmapped defaults to `info`).
 *
 *   critical → a real exposure that can reach production — act now
 *   warning  → a contained event worth review (a guardrail fired, or a gate on a
 *              protected repo)
 *   info     → routine, expected governance activity
 */
type SeverityContext = { protectedRepo: boolean }
const SEVERITY_RULES: Record<SecurityEventType, (ctx: SeverityContext) => Severity> = {
  // A committed secret is an exposure: critical on a production repo, warning elsewhere.
  secret_detected: ({ protectedRepo }) => (protectedRepo ? 'critical' : 'warning'),
  // The guardrail blocked the action — contained; notable on a protected repo, else routine.
  policy_block: ({ protectedRepo }) => (protectedRepo ? 'warning' : 'info'),
  // A human gate is routine; worth review on a protected repo, otherwise informational.
  human_approval_required: ({ protectedRepo }) => (protectedRepo ? 'warning' : 'info'),
}
const DEFAULT_SEVERITY: Severity = 'info'

export function generateSecurityEvents(
  rng: Rng,
  tasks: AgentTask[],
  repos: Repo[],
  profile: ScenarioProfile,
): SecurityEvent[] {
  const events: SecurityEvent[] = []
  let idCounter = 1

  const protectedRepos = new Set(repos.filter(r => r.protected).map(r => r.id))

  for (const task of tasks) {
    if (!rng.nextBool(profile.securityEventProb)) continue

    const type = rng.pick(EVENT_TYPES)
    const protectedRepo = protectedRepos.has(task.repoId)
    const severity = (SEVERITY_RULES[type] ?? (() => DEFAULT_SEVERITY))({ protectedRepo })

    events.push({
      id: `sec-event-${idCounter++}`,
      taskId: task.id,
      repoId: task.repoId,
      teamId: task.teamId,
      severity,
      type,
      createdAt: task.startedAt,
    })
  }

  return events
}
