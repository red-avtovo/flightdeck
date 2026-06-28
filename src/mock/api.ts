import type {
  AgentTask,
  Alert,
  AutonomyBand,
  CostMetrics,
  ErrorCategory,
  GovernanceMetrics,
  Kpi,
  MemberWithUsage,
  OrgOverview,
  OutcomesMetrics,
  Period,
  PullRequestOutcome,
  ReliabilityMetrics,
  Repo,
  RepoDetail,
  SecurityEvent,
  SecurityEventType,
  SpanType,
  TaskFilters,
  TaskType,
  Team,
  TeamDetail,
  TeamMetrics,
  TraceSpan,
  TrendPoint,
  User,
} from '../types'
import { computeTrend, isoDate, percentile } from '../lib/utils'
import { createRng } from './seed'
import { generateTeams } from './generators/generateTeams'
import { generateRepos } from './generators/generateRepos'
import { generateUsers } from './generators/generateUsers'
import { generateTasks } from './generators/generateTasks'
import { generateSpans } from './generators/generateSpans'
import { generatePROutcomes } from './generators/generatePROutcomes'
import { generateSecurityEvents } from './generators/generateSecurityEvents'

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHLY_BUDGET_USD = 50_000
const NOW = new Date('2026-06-27T00:00:00Z').getTime()

// ─── Pre-generation (runs once at module load) ────────────────────────────────

const _rng = createRng(42)
const _teams = generateTeams(_rng)
const _repos = generateRepos(_rng, _teams)
const _users = generateUsers(_rng, _teams)
const _rawTasks = generateTasks(_rng, _teams, _repos, _users)
const _spans = generateSpans(_rng, _rawTasks)
const _prOutcomes = generatePROutcomes(_rng, _rawTasks, _repos)
const _securityEvents = generateSecurityEvents(_rng, _rawTasks, _teams)

// Build lookup maps
const _prByTaskId = new Map<string, PullRequestOutcome>(_prOutcomes.map(pr => [pr.taskId, pr]))

const SPAN_MAP = new Map<string, TraceSpan[]>()
_spans.forEach(s => {
  const list = SPAN_MAP.get(s.taskId) ?? []
  list.push(s)
  SPAN_MAP.set(s.taskId, list)
})

// Enrich tasks with autonomyBand from PR outcomes (simpler form: pr ? pr.autonomyBand : 'failed')
const _tasks: AgentTask[] = _rawTasks.map(task => {
  const pr = _prByTaskId.get(task.id)
  return { ...task, autonomyBand: pr ? pr.autonomyBand : 'failed' }
})

const _taskById = new Map<string, AgentTask>(_tasks.map(t => [t.id, t]))

const _usersByTeamId = new Map<string, User[]>()
_users.forEach(u => {
  const list = _usersByTeamId.get(u.teamId) ?? []
  list.push(u)
  _usersByTeamId.set(u.teamId, list)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100))
}

function periodDays(period: Period): number {
  return period === '7d' ? 7 : period === '30d' ? 30 : 90
}

function periodMs(period: Period): number {
  return periodDays(period) * 86400000
}

function inPeriod(ts: number, period: Period): boolean {
  return ts >= NOW - periodMs(period) && ts <= NOW
}

function inPriorPeriod(ts: number, period: Period): boolean {
  const ms = periodMs(period)
  return ts >= NOW - 2 * ms && ts < NOW - ms
}

function tasksFor(period: Period, teamId?: string, repoId?: string, model?: string): AgentTask[] {
  return _tasks.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    if (!inPeriod(ts, period)) return false
    if (teamId !== undefined && t.teamId !== teamId) return false
    if (repoId !== undefined && t.repoId !== repoId) return false
    if (model !== undefined && t.model !== model) return false
    return true
  })
}

function priorTasksFor(period: Period, teamId?: string, model?: string): AgentTask[] {
  return _tasks.filter(t => {
    const ts = new Date(t.startedAt).getTime()
    if (!inPriorPeriod(ts, period)) return false
    if (teamId !== undefined && t.teamId !== teamId) return false
    if (model !== undefined && t.model !== model) return false
    return true
  })
}

function prsForTasks(taskIds: Set<string>): PullRequestOutcome[] {
  return _prOutcomes.filter(pr => taskIds.has(pr.taskId))
}

function dailySparkline(
  period: Period,
  tasks: AgentTask[],
  fn: (dayTasks: AgentTask[]) => number,
): TrendPoint[] {
  const days = periodDays(period)
  return Array.from({ length: days }, (_, i) => {
    const dayStart = NOW - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    return { date: isoDate(new Date(dayStart)), value: fn(dayTasks) }
  })
}

function simpleKpi(value: number, priorValue: number, sparkline: TrendPoint[]): Kpi {
  return { value, trendPct: computeTrend(value, priorValue), sparkline }
}

function autonomyRateOf(tasks: AgentTask[]): number {
  if (tasks.length === 0) return 0
  return tasks.filter(t => t.autonomyBand === 'autonomous').length / tasks.length
}

function totalSpend(tasks: AgentTask[]): number {
  return tasks.reduce((sum, t) => sum + t.costUsd, 0)
}

function tokenWastePct(tasks: AgentTask[]): number {
  const total = totalSpend(tasks)
  if (total === 0) return 0
  const waste = tasks.filter(t => t.status === 'failed').reduce((sum, t) => sum + t.costUsd, 0)
  return waste / total
}

function buildTeamMetrics(team: Team, tasks: AgentTask[], prs: PullRequestOutcome[]): TeamMetrics {
  const teamTasks = tasks.filter(t => t.teamId === team.id)
  const teamTaskIds = new Set(teamTasks.map(t => t.id))
  const teamPrs = prs.filter(pr => teamTaskIds.has(pr.taskId))
  const mergedPrs = teamPrs.filter(pr => pr.status === 'merged')
  const spend = totalSpend(teamTasks)
  return {
    teamId: team.id,
    teamName: team.name,
    taskCount: teamTasks.length,
    autonomyRate: autonomyRateOf(teamTasks),
    spendUsd: spend,
    costPerTask: teamTasks.length > 0 ? spend / teamTasks.length : 0,
    costPerMergedPr: mergedPrs.length > 0 ? spend / mergedPrs.length : 0,
    tokenWastePct: tokenWastePct(teamTasks),
  }
}

// ─── API Exports ──────────────────────────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  await delay()
  return [..._teams]
}

export async function getRepos(): Promise<Repo[]> {
  await delay()
  return [..._repos]
}

export async function getTaskList(filters: TaskFilters): Promise<AgentTask[]> {
  await delay()
  let result = tasksFor(filters.period)
  if (filters.teamId !== undefined) result = result.filter(t => t.teamId === filters.teamId)
  if (filters.model !== undefined) result = result.filter(t => t.model === filters.model)
  if (filters.status !== undefined) result = result.filter(t => t.status === filters.status)
  return result
}

export async function getTaskSpans(taskId: string): Promise<TraceSpan[]> {
  await delay()
  return SPAN_MAP.get(taskId) ?? []
}

export async function getSecurityEvents(period: Period): Promise<SecurityEvent[]> {
  await delay()
  const cutoff = NOW - periodMs(period)
  return _securityEvents.filter(e => new Date(e.createdAt).getTime() >= cutoff)
}

export async function getOrgOverview(
  period: Period,
  teamId?: string | null,
  model?: string | null,
): Promise<OrgOverview> {
  await delay()

  const team = teamId ?? undefined
  const mdl = model ?? undefined
  const tasks = tasksFor(period, team, undefined, mdl)
  const prior = priorTasksFor(period, team, mdl)
  const taskIds = new Set(tasks.map(t => t.id))
  const prs = prsForTasks(taskIds)
  const mergedPrs = prs.filter(pr => pr.status === 'merged')
  const priorIds = new Set(prior.map(t => t.id))
  const priorPrs = prsForTasks(priorIds)
  const priorMergedPrs = priorPrs.filter(pr => pr.status === 'merged')

  // Autonomy breakdown
  const autonomyBreakdown: Record<AutonomyBand, number> = {
    autonomous: 0, human_assisted: 0, human_rescued: 0, failed: 0,
  }
  tasks.forEach(t => { autonomyBreakdown[t.autonomyBand as AutonomyBand]++ })
  const total = tasks.length || 1
  ;(Object.keys(autonomyBreakdown) as AutonomyBand[]).forEach(k => {
    autonomyBreakdown[k] = autonomyBreakdown[k] / total
  })

  // Active users
  const activeUsersSet = new Set(tasks.map(t => t.userId))
  const priorActiveUsersSet = new Set(prior.map(t => t.userId))

  // Spend
  const spend = totalSpend(tasks)
  const priorSpend = totalSpend(prior)

  // Cost per merged PR
  const costPrMerged = mergedPrs.length > 0 ? spend / mergedPrs.length : 0
  const priorCostPrMerged = priorMergedPrs.length > 0 ? priorSpend / priorMergedPrs.length : 0

  // Median time to PR
  function medianTtp(prList: PullRequestOutcome[]): number {
    const merged = prList.filter(pr => pr.status === 'merged' && pr.mergedAt !== null)
    const times = merged
      .map(pr => {
        const task = _taskById.get(pr.taskId)
        return task ? new Date(pr.mergedAt!).getTime() - new Date(task.startedAt).getTime() : null
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b)
    return times.length > 0 ? percentile(times, 50) : 0
  }

  const ttp = medianTtp(prs)
  const priorTtp = medianTtp(priorPrs)

  // KPIs
  const kpis: OrgOverview['kpis'] = {
    tasksStarted: simpleKpi(tasks.length, prior.length,
      dailySparkline(period, tasks, t => t.length)),
    autonomyRate: simpleKpi(autonomyRateOf(tasks), autonomyRateOf(prior),
      dailySparkline(period, tasks, t => autonomyRateOf(t))),
    costPerMergedPr: simpleKpi(costPrMerged, priorCostPrMerged,
      dailySparkline(period, tasks, dayTasks => {
        const dayIds = new Set(dayTasks.map(t => t.id))
        const dayMerged = _prOutcomes.filter(pr => dayIds.has(pr.taskId) && pr.status === 'merged')
        const daySpend = totalSpend(dayTasks)
        return dayMerged.length > 0 ? daySpend / dayMerged.length : 0
      })),
    medianTimeToPr: simpleKpi(ttp, priorTtp,
      dailySparkline(period, tasks, dayTasks => {
        const dayIds = new Set(dayTasks.map(t => t.id))
        const dayMerged = _prOutcomes.filter(pr => dayIds.has(pr.taskId) && pr.status === 'merged' && pr.mergedAt !== null)
        const times = dayMerged
          .map(pr => {
            const task = _taskById.get(pr.taskId)
            return task ? new Date(pr.mergedAt!).getTime() - new Date(task.startedAt).getTime() : null
          })
          .filter((v): v is number => v !== null)
          .sort((a, b) => a - b)
        return times.length > 0 ? percentile(times, 50) : 0
      })),
    activeUsers: simpleKpi(activeUsersSet.size, priorActiveUsersSet.size,
      dailySparkline(period, tasks, t => new Set(t.map(u => u.userId)).size)),
  }

  // Tasks over time (daily breakdown by autonomy band)
  const days = periodDays(period)
  const tasksOverTime = Array.from({ length: days }, (_, i) => {
    const dayStart = NOW - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const row: { date: string } & Record<AutonomyBand, number> = {
      date: isoDate(new Date(dayStart)),
      autonomous: 0, human_assisted: 0, human_rescued: 0, failed: 0,
    }
    dayTasks.forEach(t => { row[t.autonomyBand as AutonomyBand]++ })
    return row
  })

  // Team scatter — a cross-team comparison, so it ignores the team filter (otherwise
  // selecting one team collapses the other three onto the origin). It still respects
  // the model filter; the selected team is highlighted in the UI instead.
  const scatterTasks = tasksFor(period, undefined, undefined, mdl)
  const scatterPrs = prsForTasks(new Set(scatterTasks.map(t => t.id)))
  const teamScatter = _teams.map(team => buildTeamMetrics(team, scatterTasks, scatterPrs))

  // Alerts from critical security events. When a team/model filter is active,
  // scope alerts to the filtered task set so they stay coherent with the charts.
  const filtersActive = team !== undefined || mdl !== undefined
  const criticalEvents = _securityEvents.filter(e => {
    const ts = new Date(e.createdAt).getTime()
    if (!inPeriod(ts, period) || e.severity !== 'critical') return false
    if (filtersActive && !taskIds.has(e.taskId)) return false
    return true
  })
  const alerts: Alert[] = criticalEvents.slice(0, 20).map(e => ({
    id: `alert-${e.id}`,
    severity: e.severity,
    source: 'security_event' as const,
    type: e.type,
    message: `${e.type.replace(/_/g, ' ')} detected in task ${e.taskId}`,
    refId: e.id,
    createdAt: e.createdAt,
  }))

  // Cost spike alert
  const dailyAvgSpend = tasks.length > 0 ? spend / days : 0
  const budgetDailyLimit = MONTHLY_BUDGET_USD / 30
  if (dailyAvgSpend > budgetDailyLimit * 1.5) {
    alerts.push({
      id: 'alert-cost-spike-1',
      severity: 'warning',
      source: 'cost_anomaly',
      type: 'cost_spike',
      message: `Daily spend $${dailyAvgSpend.toFixed(2)} exceeds 150% of budget`,
      refId: 'org-acme',
      createdAt: new Date(NOW).toISOString(),
    })
  }

  return { autonomyBreakdown, kpis, tasksOverTime, teamScatter, alerts }
}

export async function getOutcomesMetrics(
  period: Period,
  teamId?: string | null,
  model?: string | null,
): Promise<OutcomesMetrics> {
  await delay()

  const team = teamId ?? undefined
  const mdl = model ?? undefined
  const tasks = tasksFor(period, team, undefined, mdl)
  const prior = priorTasksFor(period, team, mdl)
  const taskIds = new Set(tasks.map(t => t.id))
  const prs = prsForTasks(taskIds)
  const mergedPrs = prs.filter(pr => pr.status === 'merged')
  const revertedPrs = prs.filter(pr => pr.status === 'reverted')
  const priorIds = new Set(prior.map(t => t.id))
  const priorPrs = prsForTasks(priorIds)
  const priorMergedPrs = priorPrs.filter(pr => pr.status === 'merged')

  const mergeRate = prs.length > 0 ? mergedPrs.length / prs.length : 0
  const priorMergeRate = priorPrs.length > 0 ? priorMergedPrs.length / priorPrs.length : 0

  const avgEditDist = prs.length > 0
    ? prs.reduce((s, p) => s + p.humanEditDistancePct, 0) / prs.length : 0
  const priorAvgEditDist = priorPrs.length > 0
    ? priorPrs.reduce((s, p) => s + p.humanEditDistancePct, 0) / priorPrs.length : 0

  const ciPassRate = prs.length > 0 ? prs.filter(p => p.ciFirstAttemptPassed).length / prs.length : 0
  const priorCiPassRate = priorPrs.length > 0
    ? priorPrs.filter(p => p.ciFirstAttemptPassed).length / priorPrs.length : 0

  const revertRate = prs.length > 0 ? revertedPrs.length / prs.length : 0
  const priorRevertedPrs = priorPrs.filter(pr => pr.status === 'reverted')
  const priorRevertRate = priorPrs.length > 0 ? priorRevertedPrs.length / priorPrs.length : 0

  function dayPrs(dayTasks: AgentTask[]): PullRequestOutcome[] {
    const dayIds = new Set(dayTasks.map(t => t.id))
    return _prOutcomes.filter(pr => dayIds.has(pr.taskId))
  }

  const kpis: OutcomesMetrics['kpis'] = {
    mergeRate: simpleKpi(mergeRate, priorMergeRate,
      dailySparkline(period, tasks, dt => {
        const dp = dayPrs(dt)
        return dp.length > 0 ? dp.filter(p => p.status === 'merged').length / dp.length : 0
      })),
    humanEditDistancePct: simpleKpi(avgEditDist, priorAvgEditDist,
      dailySparkline(period, tasks, dt => {
        const dp = dayPrs(dt)
        return dp.length > 0 ? dp.reduce((s, p) => s + p.humanEditDistancePct, 0) / dp.length : 0
      })),
    ciFirstAttemptPassRate: simpleKpi(ciPassRate, priorCiPassRate,
      dailySparkline(period, tasks, dt => {
        const dp = dayPrs(dt)
        return dp.length > 0 ? dp.filter(p => p.ciFirstAttemptPassed).length / dp.length : 0
      })),
    revertRate: simpleKpi(revertRate, priorRevertRate,
      dailySparkline(period, tasks, dt => {
        const dp = dayPrs(dt)
        return dp.length > 0 ? dp.filter(p => p.status === 'reverted').length / dp.length : 0
      })),
  }

  const editDistanceTrend = dailySparkline(period, tasks, dt => {
    const dp = dayPrs(dt)
    return dp.length > 0 ? dp.reduce((s, p) => s + p.humanEditDistancePct, 0) / dp.length : 0
  })

  const reviewCommentsTrend = dailySparkline(period, tasks, dt => {
    const dp = dayPrs(dt)
    return dp.length > 0 ? dp.reduce((s, p) => s + p.reviewComments, 0) / dp.length : 0
  })

  const TASK_TYPES: TaskType[] = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update']
  const outcomeByTaskType = TASK_TYPES.map(taskType => {
    const typeTasks = tasks.filter(t => t.taskType === taskType)
    const row: { taskType: TaskType } & Record<AutonomyBand, number> = {
      taskType, autonomous: 0, human_assisted: 0, human_rescued: 0, failed: 0,
    }
    typeTasks.forEach(t => { row[t.autonomyBand as AutonomyBand]++ })
    return row
  })

  // Group PR outcomes by repo + task type
  const grouped = new Map<string, PullRequestOutcome[]>()
  prs.forEach(pr => {
    const task = _taskById.get(pr.taskId)
    if (!task) return
    const key = `${pr.repoId}::${task.taskType}`
    const existing = grouped.get(key) ?? []
    existing.push(pr)
    grouped.set(key, existing)
  })
  const prOutcomes = Array.from(grouped.entries()).map(([key, grpPrs]) => {
    const [repoId, taskType] = key.split('::')
    const merged = grpPrs.filter(p => p.status === 'merged')
    return {
      repoId,
      taskType: taskType as TaskType,
      mergeRate: grpPrs.length > 0 ? merged.length / grpPrs.length : 0,
      avgEditDistancePct: grpPrs.length > 0
        ? grpPrs.reduce((s, p) => s + p.humanEditDistancePct, 0) / grpPrs.length : 0,
      ciFirstAttemptPassRate: grpPrs.length > 0
        ? grpPrs.filter(p => p.ciFirstAttemptPassed).length / grpPrs.length : 0,
    }
  })

  return { kpis, editDistanceTrend, outcomeByTaskType, reviewCommentsTrend, prOutcomes }
}

export async function getCostMetrics(
  period: Period,
  teamId?: string | null,
  model?: string | null,
): Promise<CostMetrics> {
  await delay()

  const team = teamId ?? undefined
  const mdl = model ?? undefined
  const tasks = tasksFor(period, team, undefined, mdl)
  const prior = priorTasksFor(period, team, mdl)
  const taskIds = new Set(tasks.map(t => t.id))
  const prs = prsForTasks(taskIds)
  const mergedPrs = prs.filter(pr => pr.status === 'merged')
  const priorIds = new Set(prior.map(t => t.id))
  const priorPrs = prsForTasks(priorIds)
  const priorMergedPrs = priorPrs.filter(pr => pr.status === 'merged')

  const spend = totalSpend(tasks)
  const priorSpend = totalSpend(prior)
  const costPerTask = tasks.length > 0 ? spend / tasks.length : 0
  const priorCostPerTask = prior.length > 0 ? priorSpend / prior.length : 0
  const costPrMerged = mergedPrs.length > 0 ? spend / mergedPrs.length : 0
  const priorCostPrMerged = priorMergedPrs.length > 0 ? priorSpend / priorMergedPrs.length : 0
  const wastePct = tokenWastePct(tasks)
  const priorWastePct = tokenWastePct(prior)

  const kpis: CostMetrics['kpis'] = {
    totalSpend: simpleKpi(spend, priorSpend,
      dailySparkline(period, tasks, dt => totalSpend(dt))),
    costPerTask: simpleKpi(costPerTask, priorCostPerTask,
      dailySparkline(period, tasks, dt => {
        const s = totalSpend(dt)
        return dt.length > 0 ? s / dt.length : 0
      })),
    costPerMergedPr: simpleKpi(costPrMerged, priorCostPrMerged,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        const dayMerged = _prOutcomes.filter(pr => dayIds.has(pr.taskId) && pr.status === 'merged')
        const daySpend = totalSpend(dt)
        return dayMerged.length > 0 ? daySpend / dayMerged.length : 0
      })),
    tokenWastePct: simpleKpi(wastePct, priorWastePct,
      dailySparkline(period, tasks, dt => tokenWastePct(dt))),
  }

  const spendTrend = dailySparkline(period, tasks, dt => totalSpend(dt))

  const days = periodDays(period)
  const budgetBurnPct = Math.min(100, (spend / MONTHLY_BUDGET_USD) * 100 * (30 / days))

  const TASK_TYPES: TaskType[] = ['bug_fix', 'feature', 'tests', 'docs', 'refactor', 'dependency_update']
  const costPerMergedPrByTaskType = TASK_TYPES.map(taskType => {
    const typeTasks = tasks.filter(t => t.taskType === taskType)
    const typeIds = new Set(typeTasks.map(t => t.id))
    const typeMerged = _prOutcomes.filter(pr => typeIds.has(pr.taskId) && pr.status === 'merged')
    const typeSpend = totalSpend(typeTasks)
    return {
      taskType,
      costUsd: typeMerged.length > 0 ? typeSpend / typeMerged.length : 0,
    }
  })

  const teamBreakdown = _teams.map(team => buildTeamMetrics(team, tasks, prs))

  return { kpis, spendTrend, budgetBurnPct, costPerMergedPrByTaskType, teamBreakdown }
}

export async function getReliabilityMetrics(
  period: Period,
  teamId?: string | null,
  model?: string | null,
): Promise<ReliabilityMetrics> {
  await delay()

  const team = teamId ?? undefined
  const mdl = model ?? undefined
  const tasks = tasksFor(period, team, undefined, mdl)
  const prior = priorTasksFor(period, team, mdl)
  const taskIds = new Set(tasks.map(t => t.id))
  const priorIds = new Set(prior.map(t => t.id))
  const spans = _spans.filter(s => taskIds.has(s.taskId))
  const priorSpans = _spans.filter(s => priorIds.has(s.taskId))

  // Task durations (terminal tasks only)
  function sortedDurations(taskList: AgentTask[]): number[] {
    return taskList
      .filter(t => t.completedAt !== null)
      .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
      .sort((a, b) => a - b)
  }
  const durations = sortedDurations(tasks)
  const priorDurations = sortedDurations(prior)
  const p95Dur = durations.length > 0 ? percentile(durations, 95) : 0
  const priorP95Dur = priorDurations.length > 0 ? percentile(priorDurations, 95) : 0

  // Tool failure rate
  const errorSpans = spans.filter(s => s.status === 'error' || s.status === 'blocked')
  const toolFailRate = spans.length > 0 ? errorSpans.length / spans.length : 0
  const priorErrorSpans = priorSpans.filter(s => s.status === 'error' || s.status === 'blocked')
  const priorToolFailRate = priorSpans.length > 0 ? priorErrorSpans.length / priorSpans.length : 0

  // Timeout rate
  const timeoutSpans = spans.filter(s => s.status === 'timeout')
  const timeoutRate = spans.length > 0 ? timeoutSpans.length / spans.length : 0
  const priorTimeoutSpans = priorSpans.filter(s => s.status === 'timeout')
  const priorTimeoutRate = priorSpans.length > 0 ? priorTimeoutSpans.length / priorSpans.length : 0

  // Env setup p95
  function envP95(spanList: typeof spans): number {
    const envDurs = spanList
      .filter(s => s.type === 'env_setup')
      .map(s => s.durationMs)
      .sort((a, b) => a - b)
    return envDurs.length > 0 ? percentile(envDurs, 95) : 0
  }
  const envSetupP95 = envP95(spans)
  const priorEnvSetupP95 = envP95(priorSpans)

  const kpis: ReliabilityMetrics['kpis'] = {
    p95TaskDurationMs: simpleKpi(p95Dur, priorP95Dur,
      dailySparkline(period, tasks, dt => {
        const durs = sortedDurations(dt)
        return durs.length > 0 ? percentile(durs, 95) : 0
      })),
    toolFailureRate: simpleKpi(toolFailRate, priorToolFailRate,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        const daySpans = _spans.filter(s => dayIds.has(s.taskId))
        const errors = daySpans.filter(s => s.status === 'error' || s.status === 'blocked')
        return daySpans.length > 0 ? errors.length / daySpans.length : 0
      })),
    timeoutRate: simpleKpi(timeoutRate, priorTimeoutRate,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        const daySpans = _spans.filter(s => dayIds.has(s.taskId))
        const timeouts = daySpans.filter(s => s.status === 'timeout')
        return daySpans.length > 0 ? timeouts.length / daySpans.length : 0
      })),
    envSetupP95Ms: simpleKpi(envSetupP95, priorEnvSetupP95,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        return envP95(_spans.filter(s => dayIds.has(s.taskId)))
      })),
  }

  const days = periodDays(period)

  const durationTrend = Array.from({ length: days }, (_, i) => {
    const dayStart = NOW - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const durs = sortedDurations(dayTasks)
    return {
      date: isoDate(new Date(dayStart)),
      p50: durs.length > 0 ? percentile(durs, 50) : 0,
      p95: durs.length > 0 ? percentile(durs, 95) : 0,
    }
  })

  const errorRateByCategory = Array.from({ length: days }, (_, i) => {
    const dayStart = NOW - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const dayIds = new Set(dayTasks.map(t => t.id))
    const daySpans = _spans.filter(s => dayIds.has(s.taskId) && s.errorCategory !== undefined)
    const row: { date: string } & Record<ErrorCategory, number> = {
      date: isoDate(new Date(dayStart)),
      tool_error: 0, timeout: 0, env_setup: 0, policy_block: 0, model_error: 0, test_failure: 0,
    }
    daySpans.forEach(s => {
      if (s.errorCategory !== undefined) row[s.errorCategory]++
    })
    return row
  })

  const SPAN_TYPES: SpanType[] = [
    'model_call', 'shell_command', 'git_operation', 'test_run', 'policy_check', 'env_setup',
  ]
  const toolPerformance = SPAN_TYPES.map(tool => {
    const toolSpans = spans.filter(s => s.type === tool)
    const errSpans = toolSpans.filter(
      s => s.status === 'error' || s.status === 'blocked' || s.status === 'timeout',
    )
    const latencies = toolSpans.map(s => s.durationMs).sort((a, b) => a - b)
    return {
      tool,
      callCount: toolSpans.length,
      errorRate: toolSpans.length > 0 ? errSpans.length / toolSpans.length : 0,
      p50LatencyMs: latencies.length > 0 ? percentile(latencies, 50) : 0,
      p95LatencyMs: latencies.length > 0 ? percentile(latencies, 95) : 0,
    }
  })

  return { kpis, durationTrend, errorRateByCategory, toolPerformance }
}

export async function getGovernanceMetrics(
  period: Period,
  teamId?: string | null,
  model?: string | null,
): Promise<GovernanceMetrics> {
  await delay()

  const team = teamId ?? undefined
  const mdl = model ?? undefined
  const tasks = tasksFor(period, team, undefined, mdl)
  const prior = priorTasksFor(period, team, mdl)
  const taskIds = new Set(tasks.map(t => t.id))
  const priorIds = new Set(prior.map(t => t.id))

  const events = _securityEvents.filter(e => taskIds.has(e.taskId))
  const priorEvents = _securityEvents.filter(e => priorIds.has(e.taskId))

  const policyBlocks = events.filter(e => e.type === 'policy_block').length
  const secretsDetected = events.filter(e => e.type === 'secret_detected').length
  const humanApprovals = events.filter(e => e.type === 'human_approval_required').length

  const priorPolicyBlocks = priorEvents.filter(e => e.type === 'policy_block').length
  const priorSecretsDetected = priorEvents.filter(e => e.type === 'secret_detected').length
  const priorHumanApprovals = priorEvents.filter(e => e.type === 'human_approval_required').length

  const kpis: GovernanceMetrics['kpis'] = {
    policyBlocks: simpleKpi(policyBlocks, priorPolicyBlocks,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        return _securityEvents.filter(e => dayIds.has(e.taskId) && e.type === 'policy_block').length
      })),
    secretsDetected: simpleKpi(secretsDetected, priorSecretsDetected,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        return _securityEvents.filter(e => dayIds.has(e.taskId) && e.type === 'secret_detected').length
      })),
    humanApprovalsRequired: simpleKpi(humanApprovals, priorHumanApprovals,
      dailySparkline(period, tasks, dt => {
        const dayIds = new Set(dt.map(t => t.id))
        return _securityEvents.filter(e => dayIds.has(e.taskId) && e.type === 'human_approval_required').length
      })),
  }

  const days = periodDays(period)
  const eventsOverTime = Array.from({ length: days }, (_, i) => {
    const dayStart = NOW - (days - 1 - i) * 86400000
    const dayEnd = dayStart + 86400000
    const dayTasks = tasks.filter(t => {
      const ts = new Date(t.startedAt).getTime()
      return ts >= dayStart && ts < dayEnd
    })
    const dayIds = new Set(dayTasks.map(t => t.id))
    const dayEvents = _securityEvents.filter(e => dayIds.has(e.taskId))
    const row: { date: string } & Record<SecurityEventType, number> = {
      date: isoDate(new Date(dayStart)),
      policy_block: 0, secret_detected: 0, human_approval_required: 0,
    }
    dayEvents.forEach(e => { row[e.type]++ })
    return row
  })

  return { kpis, eventsOverTime, events }
}

export async function getTeamDetail(teamId: string, period: Period): Promise<TeamDetail> {
  await delay()

  const team = _teams.find(t => t.id === teamId)!
  const tasks = tasksFor(period, teamId)
  const taskIds = new Set(tasks.map(t => t.id))
  const prs = prsForTasks(taskIds)
  const mergedPrs = prs.filter(pr => pr.status === 'merged')
  const members = _usersByTeamId.get(teamId) ?? []

  const spend = totalSpend(tasks)
  const rate = autonomyRateOf(tasks)

  const spans = _spans.filter(s => taskIds.has(s.taskId))
  const errSpans = spans.filter(s => s.status === 'error' || s.status === 'blocked')
  const govEvents = _securityEvents.filter(e => taskIds.has(e.taskId))

  const durations = tasks
    .filter(t => t.completedAt !== null)
    .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
    .sort((a, b) => a - b)

  // Avg edit distance stored as 0–100; normalise to 0–1 for the percent KpiCard format
  const avgEditDistance = prs.length > 0
    ? prs.reduce((s, p) => s + p.humanEditDistancePct, 0) / prs.length / 100
    : 0

  const sections: TeamDetail['sections'] = {
    // Outcomes: Merge Rate (percent) + Avg Edit Distance (percent)
    outcomes: [
      { value: prs.length > 0 ? mergedPrs.length / prs.length : 0, trendPct: null, sparkline: [] },
      { value: avgEditDistance, trendPct: null, sparkline: [] },
    ],
    // Cost: Cost/Merged PR (currency) + Token Waste % (percent)
    cost: [
      { value: mergedPrs.length > 0 ? spend / mergedPrs.length : 0, trendPct: null, sparkline: [] },
      { value: tokenWastePct(tasks), trendPct: null, sparkline: [] },
    ],
    // Reliability: P95 Task Duration (duration ms) + Tool Failure Rate (percent)
    reliability: [
      { value: durations.length > 0 ? percentile(durations, 95) : 0, trendPct: null, sparkline: [] },
      { value: spans.length > 0 ? errSpans.length / spans.length : 0, trendPct: null, sparkline: [] },
    ],
    // Governance: Policy Blocks (number) + Secrets Detected (number)
    governance: [
      { value: govEvents.filter(e => e.type === 'policy_block').length, trendPct: null, sparkline: [] },
      { value: govEvents.filter(e => e.type === 'secret_detected').length, trendPct: null, sparkline: [] },
    ],
  }

  // Per-member usage stats derived from tasks in the selected period
  const membersWithUsage: MemberWithUsage[] = members.map(m => {
    const memberTasks = tasks.filter(t => t.userId === m.id)
    return {
      ...m,
      taskCount: memberTasks.length,
      autonomyRate: autonomyRateOf(memberTasks),
      spendUsd: totalSpend(memberTasks),
    }
  })

  return {
    team,
    autonomyRate: rate,
    taskCount: tasks.length,
    spendUsd: spend,
    sections,
    members: membersWithUsage,
  }
}

export async function getRepoDetail(repoId: string, period: Period): Promise<RepoDetail> {
  await delay()

  const repo = _repos.find(r => r.id === repoId)!
  const owningTeam = _teams.find(t => t.id === repo.teamId)
  const teamName = owningTeam?.name ?? repo.teamId

  const tasks = tasksFor(period, undefined, repoId)
  const taskIds = new Set(tasks.map(t => t.id))
  const prs = prsForTasks(taskIds)
  const mergedPrs = prs.filter(pr => pr.status === 'merged')

  const spend = totalSpend(tasks)
  const rate = autonomyRateOf(tasks)

  const spans = _spans.filter(s => taskIds.has(s.taskId))
  const errSpans = spans.filter(s => s.status === 'error' || s.status === 'blocked')
  const govEvents = _securityEvents.filter(e => taskIds.has(e.taskId))

  const durations = tasks
    .filter(t => t.completedAt !== null)
    .map(t => new Date(t.completedAt!).getTime() - new Date(t.startedAt).getTime())
    .sort((a, b) => a - b)

  // Avg edit distance stored as 0–100; normalise to 0–1 for the percent KpiCard format
  const avgEditDistance = prs.length > 0
    ? prs.reduce((s, p) => s + p.humanEditDistancePct, 0) / prs.length / 100
    : 0

  const sections: RepoDetail['sections'] = {
    // Outcomes: Merge Rate (percent) + Avg Edit Distance (percent)
    outcomes: [
      { value: prs.length > 0 ? mergedPrs.length / prs.length : 0, trendPct: null, sparkline: [] },
      { value: avgEditDistance, trendPct: null, sparkline: [] },
    ],
    // Cost: Cost/Merged PR (currency) + Token Waste % (percent)
    cost: [
      { value: mergedPrs.length > 0 ? spend / mergedPrs.length : 0, trendPct: null, sparkline: [] },
      { value: tokenWastePct(tasks), trendPct: null, sparkline: [] },
    ],
    // Reliability: P95 Task Duration (duration ms) + Tool Failure Rate (percent)
    reliability: [
      { value: durations.length > 0 ? percentile(durations, 95) : 0, trendPct: null, sparkline: [] },
      { value: spans.length > 0 ? errSpans.length / spans.length : 0, trendPct: null, sparkline: [] },
    ],
    // Governance: Policy Blocks (number) + Secrets Detected (number)
    governance: [
      { value: govEvents.filter(e => e.type === 'policy_block').length, trendPct: null, sparkline: [] },
      { value: govEvents.filter(e => e.type === 'secret_detected').length, trendPct: null, sparkline: [] },
    ],
  }

  return {
    repo,
    teamName,
    autonomyRate: rate,
    taskCount: tasks.length,
    spendUsd: spend,
    sections,
  }
}
