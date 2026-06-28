import type { Rng } from '../seed'
import type { ScenarioProfile } from '../scenario'
import type { AgentTask, PRStatus, PullRequestOutcome, Repo } from '../../types'
import { classifyAutonomy } from '../../lib/utils'

export function generatePROutcomes(
  rng: Rng,
  tasks: AgentTask[],
  _repos: Repo[],
  profile: ScenarioProfile,
): PullRequestOutcome[] {
  const outcomes: PullRequestOutcome[] = []

  for (const task of tasks) {
    if (task.prId === null) continue

    const openedAt = task.startedAt
    const prStatusRoll = rng.next()
    let status: PRStatus
    if (prStatusRoll < profile.prMergedThresh) status = 'merged'
    else if (prStatusRoll < profile.prClosedThresh) status = 'closed_unmerged'
    else if (prStatusRoll < profile.prOpenThresh) status = 'open'
    else status = 'reverted'

    const [minEdit, maxEdit] = profile.editDistanceRanges[task.taskType]
    const humanEditDistancePct = rng.nextFloat(minEdit, maxEdit)

    const mergedAt = status === 'merged' || status === 'reverted'
      ? new Date(new Date(openedAt).getTime() + rng.nextInt(3600000, 172800000)).toISOString()
      : null

    const ciFirstAttemptPassed = rng.nextBool(profile.ciFirstPassProb)
    const ciAttempts = ciFirstAttemptPassed ? 1 : rng.nextInt(2, 4)
    const ciStatus = status === 'merged'
      ? (rng.nextBool(profile.ciMergedPassProb) ? 'passed' : 'failed')
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
