import type { Rng } from '../seed'
import type { AgentTask, PRStatus, PullRequestOutcome, Repo, TaskType } from '../../types'
import { classifyAutonomy } from '../../lib/utils'

// Lower human-edit-distance ranges: agents land most PRs with little rework, so the
// majority classify as "autonomous" (< 20%) rather than "human-assisted".
const EDIT_DISTANCE_RANGES: Record<TaskType, [number, number]> = {
  docs: [3, 15],
  feature: [10, 45],
  bug_fix: [5, 28],
  tests: [3, 12],
  refactor: [8, 32],
  dependency_update: [0, 8],
}

export function generatePROutcomes(rng: Rng, tasks: AgentTask[], _repos: Repo[]): PullRequestOutcome[] {
  const outcomes: PullRequestOutcome[] = []

  for (const task of tasks) {
    if (task.prId === null) continue

    const openedAt = task.startedAt
    // Strong merge rate; closed-unmerged / abandoned-open / reverted are the exception.
    const prStatusRoll = rng.next()
    let status: PRStatus
    if (prStatusRoll < 0.95) status = 'merged'
    else if (prStatusRoll < 0.97) status = 'closed_unmerged'
    else if (prStatusRoll < 0.985) status = 'open'
    else status = 'reverted'

    const [minEdit, maxEdit] = EDIT_DISTANCE_RANGES[task.taskType]
    const humanEditDistancePct = rng.nextFloat(minEdit, maxEdit)

    const mergedAt = status === 'merged' || status === 'reverted'
      ? new Date(new Date(openedAt).getTime() + rng.nextInt(3600000, 172800000)).toISOString()
      : null

    const ciFirstAttemptPassed = rng.nextBool(0.92)
    const ciAttempts = ciFirstAttemptPassed ? 1 : rng.nextInt(2, 4)
    const ciStatus = status === 'merged'
      ? (rng.nextBool(0.97) ? 'passed' : 'failed')
      : 'not_run'

    const autonomyBand = classifyAutonomy({
      status: status === 'merged' ? 'completed' : 'failed',
      prMerged: status === 'merged',
      editDistancePct: humanEditDistancePct,
      prReverted: status === 'reverted',
      humanInterventionRequired: task.humanInterventionRequired,
    })

    outcomes.push({
      id: task.prId,
      taskId: task.id,
      repoId: task.repoId,
      openedAt,
      mergedAt,
      status,
      ciStatus,
      ciFirstAttemptPassed,
      ciAttempts,
      reviewComments: rng.nextInt(0, 15),
      changeRequests: rng.nextInt(0, 4),
      agentCommits: rng.nextInt(1, 8),
      humanCommitsAfterAgent: rng.nextInt(0, 5),
      humanEditDistancePct,
      filesChanged: rng.nextInt(1, 25),
      linesAdded: rng.nextInt(10, 500),
      linesDeleted: rng.nextInt(0, 200),
      autonomyBand,
    })
  }

  return outcomes
}
