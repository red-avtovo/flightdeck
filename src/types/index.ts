export type Period = '7d' | '30d' | '90d'

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'blocked'
export type TaskType = 'bug_fix' | 'feature' | 'tests' | 'docs' | 'refactor' | 'dependency_update'
export type PRStatus = 'open' | 'merged' | 'closed_unmerged' | 'reverted'
export type SpanType = 'model_call' | 'shell_command' | 'git_operation' | 'test_run' | 'policy_check' | 'env_setup'
export type SpanStatus = 'ok' | 'error' | 'blocked' | 'timeout'
export type ErrorCategory = 'tool_error' | 'timeout' | 'env_setup' | 'policy_block' | 'model_error' | 'test_failure'
export type SecurityEventType = 'policy_block' | 'secret_detected' | 'human_approval_required'
export type Severity = 'critical' | 'warning' | 'info'
export type AutonomyBand = 'autonomous' | 'human_assisted' | 'human_rescued' | 'failed'

export interface Team {
  id: string
  name: string
  memberCount: number
}

export interface Repo {
  id: string
  name: string
  teamId: string
  testCommandDetected: boolean
  ciConfigured: boolean
  agentInstructionsPresent: boolean
}

export interface User {
  id: string
  teamId: string
  name: string
  email: string
  firstActive: string
  lastActive: string
}

export interface AgentTask {
  id: string
  orgId: string
  teamId: string
  repoId: string
  userId: string
  taskType: TaskType
  status: TaskStatus
  startedAt: string
  completedAt: string | null
  model: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  toolCallCount: number
  failedToolCallCount: number
  policyBlockCount: number
  humanInterventionRequired: boolean
  prId: string | null
  autonomyBand: AutonomyBand | null
}

export interface TraceSpan {
  id: string
  taskId: string
  type: SpanType
  name: string
  startedAt: string
  durationMs: number
  status: SpanStatus
  errorCategory?: ErrorCategory
  source: 'agent' | 'operator'
  costUsd?: number
  inputTokens?: number
  outputTokens?: number
}

export interface PullRequestOutcome {
  id: string
  taskId: string
  repoId: string
  openedAt: string
  mergedAt: string | null
  status: PRStatus
  ciStatus: 'passed' | 'failed' | 'not_run'
  ciFirstAttemptPassed: boolean
  ciAttempts: number
  reviewComments: number
  changeRequests: number
  agentCommits: number
  humanCommitsAfterAgent: number
  humanEditDistancePct: number
  filesChanged: number
  linesAdded: number
  linesDeleted: number
  autonomyBand: AutonomyBand
}

export interface SecurityEvent {
  id: string
  taskId: string
  repoId: string
  teamId: string
  severity: Severity
  type: SecurityEventType
  createdAt: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface Kpi {
  value: number
  trendPct: number | null
  sparkline: TrendPoint[]
}

export interface Alert {
  id: string
  severity: Severity
  source: 'security_event' | 'cost_anomaly'
  type: SecurityEventType | 'cost_spike'
  message: string
  refId: string
  createdAt: string
}

export interface TeamMetrics {
  teamId: string
  teamName: string
  taskCount: number
  autonomyRate: number
  spendUsd: number
  costPerTask: number
  costPerMergedPr: number
  tokenWastePct: number
}

export interface OrgOverview {
  autonomyBreakdown: Record<AutonomyBand, number>
  kpis: Record<'tasksStarted' | 'autonomyRate' | 'costPerMergedPr' | 'medianTimeToPr' | 'activeUsers', Kpi>
  tasksOverTime: Array<{ date: string } & Record<AutonomyBand, number>>
  teamScatter: TeamMetrics[]
  alerts: Alert[]
}

export interface OutcomesMetrics {
  kpis: Record<'mergeRate' | 'humanEditDistancePct' | 'ciFirstAttemptPassRate' | 'revertRate', Kpi>
  editDistanceTrend: TrendPoint[]
  outcomeByTaskType: Array<{ taskType: TaskType } & Record<AutonomyBand, number>>
  reviewCommentsTrend: TrendPoint[]
  prOutcomes: Array<{
    repoId: string
    taskType: TaskType
    mergeRate: number
    avgEditDistancePct: number
    ciFirstAttemptPassRate: number
  }>
}

export interface CostMetrics {
  kpis: Record<'totalSpend' | 'costPerTask' | 'costPerMergedPr' | 'tokenWastePct', Kpi>
  spendTrend: TrendPoint[]
  budgetBurnPct: number
  costPerMergedPrByTaskType: Array<{ taskType: TaskType; costUsd: number }>
  teamBreakdown: TeamMetrics[]
}

export interface ToolStat {
  tool: SpanType
  callCount: number
  errorRate: number
  p50LatencyMs: number
  p95LatencyMs: number
}

export interface ReliabilityMetrics {
  kpis: Record<'p95TaskDurationMs' | 'toolFailureRate' | 'timeoutRate' | 'envSetupP95Ms', Kpi>
  durationTrend: Array<{ date: string; p50: number; p95: number }>
  errorRateByCategory: Array<{ date: string } & Record<ErrorCategory, number>>
  toolPerformance: ToolStat[]
}

export interface GovernanceMetrics {
  kpis: Record<'policyBlocks' | 'secretsDetected' | 'humanApprovalsRequired', Kpi>
  eventsOverTime: Array<{ date: string } & Record<SecurityEventType, number>>
  events: SecurityEvent[]
  /** Critical security events in the period — the alerts the Overview shows. */
  criticalAlerts: number
}

export interface MemberWithUsage extends User {
  /** Tasks started by this member in the selected period */
  taskCount: number
  /** Fraction of this member's tasks that completed autonomously (0–1) */
  autonomyRate: number
  /** Total cost of this member's tasks in USD for the selected period */
  spendUsd: number
}

export interface TeamDetail {
  team: Team
  autonomyRate: number
  taskCount: number
  spendUsd: number
  sections: {
    outcomes: Kpi[]
    cost: Kpi[]
    reliability: Kpi[]
    governance: Kpi[]
  }
  /** Per-member usage stats for self-service insight (not a ranking; FR-07) */
  members: MemberWithUsage[]
}

export interface RepoDetail {
  repo: Repo
  /** Human-readable name of the team that owns this repo */
  teamName: string
  autonomyRate: number
  taskCount: number
  spendUsd: number
  sections: {
    outcomes: Kpi[]
    cost: Kpi[]
    reliability: Kpi[]
    governance: Kpi[]
  }
}

export interface TaskFilters {
  period: Period
  teamId?: string
  model?: string
  status?: TaskStatus
}
