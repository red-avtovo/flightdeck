import type { Rng } from '../seed'
import type { ScenarioProfile } from '../scenario'
import type { AgentTask, Repo, TaskStatus, TaskType, Team, User } from '../../types'

const TASK_TYPES: TaskType[] = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update']
const MODELS = ['claude-opus-4', 'claude-sonnet-4-6', 'claude-haiku-4-5'] as const
const MODEL_WEIGHTS = [0.15, 0.55, 0.30]

const TOKEN_COST: Record<string, { inputPerM: number; outputPerM: number }> = {
  'claude-opus-4': { inputPerM: 15, outputPerM: 75 },
  'claude-sonnet-4-6': { inputPerM: 3, outputPerM: 15 },
  'claude-haiku-4-5': { inputPerM: 0.25, outputPerM: 1.25 },
}

const ALL_STATUSES: TaskStatus[] = ['completed', 'cancelled', 'failed', 'queued', 'running']

function weightedPick<T>(rng: Rng, items: readonly T[], weights: number[]): T {
  const r = rng.next()
  let cumulative = 0
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i]
    if (r < cumulative) return items[i]
  }
  return items[items.length - 1]
}

function repoForTeam(repos: Repo[], teamId: string): Repo {
  const teamRepos = repos.filter(r => r.teamId === teamId)
  return teamRepos[0]
}

export function generateTasks(
  rng: Rng,
  teams: Team[],
  repos: Repo[],
  users: User[],
  profile: ScenarioProfile,
  windowDays = 90,
): AgentTask[] {
  const now = new Date('2026-06-27T00:00:00Z').getTime()
  const tasks: AgentTask[] = []
  let idCounter = 1

  for (let dayOffset = windowDays - 1; dayOffset >= 0; dayOffset--) {
    const dayStart = now - dayOffset * 86400000
    const date = new Date(dayStart)
    const dayOfWeek = date.getUTCDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const growthFactor = 1 + (0.3 * (windowDays - 1 - dayOffset)) / (windowDays - 1)
    const baseCount = isWeekend ? 6 : 9
    const count = Math.round(baseCount * growthFactor * rng.nextFloat(0.8, 1.2))

    for (let j = 0; j < count; j++) {
      const team = rng.pick(teams)
      const teamUsers = users.filter(u => u.teamId === team.id)
      const user = rng.pick(teamUsers.length > 0 ? teamUsers : users)
      const repo = repoForTeam(repos, team.id)
      const model = weightedPick(rng, MODELS, MODEL_WEIGHTS)
      const taskType = rng.pick(TASK_TYPES)
      const maxSecond = dayOffset > 0 ? 86399 : 0
      const startedAt = new Date(dayStart + rng.nextInt(0, maxSecond) * 1000).toISOString()
      const durationMs = Math.round(rng.logNormal(Math.log(180000), 0.8))
      const calculatedCompletedAt = new Date(new Date(startedAt).getTime() + durationMs).toISOString()
      const status = weightedPick(rng, ALL_STATUSES, profile.statusWeights)
      const isNonTerminal = status === 'queued' || status === 'running'
      const completedAt = isNonTerminal ? null : calculatedCompletedAt
      // Scale token usage to enterprise volumes so spend reads in the thousands (demo-sized),
      // not cents. The multiplier keeps the same draw, so determinism is preserved.
      const inputTokens = rng.nextInt(1000, 50000) * profile.tokenScale
      const outputTokens = rng.nextInt(500, 20000) * profile.tokenScale
      const costs = TOKEN_COST[model]
      const costUsd = (inputTokens / 1e6) * costs.inputPerM + (outputTokens / 1e6) * costs.outputPerM
      const toolCallCount = rng.nextInt(5, 80)
      // Draw unconditionally to keep the RNG sequence stable, then enforce coherence:
      // a successful task has zero failed tool calls; non-terminal tasks haven't failed yet.
      const failedToolCallDraw = status === 'failed' ? rng.nextInt(1, 10) : rng.nextInt(0, 3)
      const failedToolCallCount =
        status === 'completed' || status === 'queued' || status === 'running' ? 0 : failedToolCallDraw
      const policyBlockCount = rng.nextBool(profile.policyBlockProb) ? rng.nextInt(1, 3) : 0
      const humanInterventionRequired = rng.nextBool(profile.humanInterventionProb)
      const hasPr = status === 'completed' && rng.nextBool(profile.hasPrProb)
      const prId = (hasPr && !isNonTerminal) ? `pr-${idCounter}` : null

      tasks.push({
        id: `task-${idCounter++}`,
        orgId: 'org-acme',
        teamId: team.id,
        repoId: repo.id,
        userId: user.id,
        taskType,
        status,
        startedAt,
        completedAt,
        model,
        inputTokens,
        outputTokens,
        costUsd,
        toolCallCount,
        failedToolCallCount,
        policyBlockCount,
        humanInterventionRequired,
        prId,
        autonomyBand: null,
      })
    }
  }

  return tasks
}
