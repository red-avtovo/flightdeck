import type { Rng } from '../seed'
import type { AgentTask, SecurityEvent, SecurityEventType, Severity, Team } from '../../types'

const EVENT_TYPES: SecurityEventType[] = ['policy_block', 'secret_detected', 'human_approval_required']

export function generateSecurityEvents(rng: Rng, tasks: AgentTask[], _teams: Team[]): SecurityEvent[] {
  const events: SecurityEvent[] = []
  let idCounter = 1

  const now = new Date('2026-06-27T00:00:00Z').getTime()
  const day60Start = now - 30 * 86400000

  for (const task of tasks) {
    if (!rng.nextBool(0.12)) continue

    const type = rng.pick(EVENT_TYPES)
    const taskTime = new Date(task.startedAt).getTime()
    const isNearSpike = Math.abs(taskTime - day60Start) < 86400000 * 3
    const severity: Severity = isNearSpike && type === 'policy_block'
      ? 'critical'
      : rng.nextBool(0.15)
      ? 'critical'
      : rng.nextBool(0.4)
      ? 'warning'
      : 'info'

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
