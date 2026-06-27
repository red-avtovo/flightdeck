import { describe, it, expect } from 'vitest'
import {
  getTeams,
  getRepos,
  getTasks,
  getOrgOverview,
  getOutcomesMetrics,
  getCostMetrics,
  getReliabilityMetrics,
  getGovernanceMetrics,
  getTeamDetail,
  getRepoDetail,
} from '../api'

describe('Mock API', () => {
  describe('getTeams', () => {
    it('returns exactly 4 teams', async () => {
      const teams = await getTeams()
      expect(teams).toHaveLength(4)
    })

    it('includes Platform, Product, Data Science, Mobile', async () => {
      const teams = await getTeams()
      const names = teams.map(t => t.name)
      expect(names).toContain('Platform')
      expect(names).toContain('Product')
      expect(names).toContain('Data Science')
      expect(names).toContain('Mobile')
    })

    it('is deterministic', async () => {
      expect(await getTeams()).toEqual(await getTeams())
    })
  })

  describe('getRepos', () => {
    it('returns exactly 5 repos', async () => {
      const repos = await getRepos()
      expect(repos).toHaveLength(5)
    })

    it('each repo has a teamId', async () => {
      const repos = await getRepos()
      repos.forEach(r => expect(r.teamId).toBeTruthy())
    })

    it('is deterministic', async () => {
      expect(await getRepos()).toEqual(await getRepos())
    })
  })

  describe('getTasks', () => {
    it('90d returns more tasks than 7d', async () => {
      const tasks7 = await getTasks({ period: '7d' })
      const tasks90 = await getTasks({ period: '90d' })
      expect(tasks90.length).toBeGreaterThan(tasks7.length)
    })

    it('30d returns more tasks than 7d and fewer than 90d', async () => {
      const tasks7 = await getTasks({ period: '7d' })
      const tasks30 = await getTasks({ period: '30d' })
      const tasks90 = await getTasks({ period: '90d' })
      expect(tasks30.length).toBeGreaterThan(tasks7.length)
      expect(tasks30.length).toBeLessThan(tasks90.length)
    })

    it('teamId filter returns only tasks for that team', async () => {
      const all = await getTasks({ period: '90d' })
      const filtered = await getTasks({ period: '90d', teamId: 'team-platform' })
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.length).toBeLessThan(all.length)
      filtered.forEach(t => expect(t.teamId).toBe('team-platform'))
    })

    it('all tasks have autonomyBand assigned by the API', async () => {
      const tasks = await getTasks({ period: '90d' })
      tasks.forEach(t => expect(t.autonomyBand).not.toBeNull())
    })

    it('status filter returns only matching tasks', async () => {
      const completed = await getTasks({ period: '90d', status: 'completed' })
      completed.forEach(t => expect(t.status).toBe('completed'))
    })

    it('is deterministic', async () => {
      expect(await getTasks({ period: '30d' })).toEqual(await getTasks({ period: '30d' }))
    })
  })

  describe('getOrgOverview', () => {
    it('has all 4 autonomyBreakdown bands', async () => {
      const ov = await getOrgOverview('30d')
      expect(ov.autonomyBreakdown).toHaveProperty('autonomous')
      expect(ov.autonomyBreakdown).toHaveProperty('human_assisted')
      expect(ov.autonomyBreakdown).toHaveProperty('human_rescued')
      expect(ov.autonomyBreakdown).toHaveProperty('failed')
    })

    it('has all 5 required KPIs', async () => {
      const ov = await getOrgOverview('30d')
      expect(ov.kpis).toHaveProperty('tasksStarted')
      expect(ov.kpis).toHaveProperty('autonomyRate')
      expect(ov.kpis).toHaveProperty('costPerMergedPr')
      expect(ov.kpis).toHaveProperty('medianTimeToPr')
      expect(ov.kpis).toHaveProperty('activeUsers')
    })

    it('sparklines have period-length data points', async () => {
      const ov = await getOrgOverview('30d')
      expect(ov.kpis.tasksStarted.sparkline).toHaveLength(30)
      expect(ov.kpis.tasksStarted.sparkline[0]).toHaveProperty('date')
      expect(ov.kpis.tasksStarted.sparkline[0]).toHaveProperty('value')
    })

    it('tasksOverTime length equals period days', async () => {
      const ov7 = await getOrgOverview('7d')
      expect(ov7.tasksOverTime).toHaveLength(7)
      const ov30 = await getOrgOverview('30d')
      expect(ov30.tasksOverTime).toHaveLength(30)
    })

    it('tasksOverTime rows have all 4 autonomy band keys', async () => {
      const ov = await getOrgOverview('7d')
      ov.tasksOverTime.forEach(row => {
        expect(row).toHaveProperty('date')
        expect(row).toHaveProperty('autonomous')
        expect(row).toHaveProperty('human_assisted')
        expect(row).toHaveProperty('human_rescued')
        expect(row).toHaveProperty('failed')
      })
    })

    it('teamScatter has 4 entries', async () => {
      const ov = await getOrgOverview('30d')
      expect(ov.teamScatter).toHaveLength(4)
    })

    it('alerts is an array', async () => {
      const ov = await getOrgOverview('90d')
      expect(Array.isArray(ov.alerts)).toBe(true)
    })

    it('90d tasksStarted exceeds 7d tasksStarted', async () => {
      const ov90 = await getOrgOverview('90d')
      const ov7 = await getOrgOverview('7d')
      expect(ov90.kpis.tasksStarted.value).toBeGreaterThan(ov7.kpis.tasksStarted.value)
    })

    it('is deterministic', async () => {
      expect(await getOrgOverview('30d')).toEqual(await getOrgOverview('30d'))
    })
  })

  describe('getOutcomesMetrics', () => {
    it('has all 4 required KPIs', async () => {
      const m = await getOutcomesMetrics('30d')
      expect(m.kpis).toHaveProperty('mergeRate')
      expect(m.kpis).toHaveProperty('humanEditDistancePct')
      expect(m.kpis).toHaveProperty('ciFirstAttemptPassRate')
      expect(m.kpis).toHaveProperty('revertRate')
    })

    it('editDistanceTrend has period-length entries', async () => {
      const m = await getOutcomesMetrics('7d')
      expect(m.editDistanceTrend).toHaveLength(7)
    })

    it('outcomeByTaskType covers all 6 task types', async () => {
      const m = await getOutcomesMetrics('90d')
      expect(m.outcomeByTaskType).toHaveLength(6)
      const taskTypes = m.outcomeByTaskType.map(o => o.taskType)
      expect(taskTypes).toContain('bug_fix')
      expect(taskTypes).toContain('feature')
      expect(taskTypes).toContain('dependency_update')
    })

    it('prOutcomes has entries with required fields', async () => {
      const m = await getOutcomesMetrics('90d')
      expect(m.prOutcomes.length).toBeGreaterThan(0)
      m.prOutcomes.forEach(p => {
        expect(p.repoId).toBeTruthy()
        expect(p.taskType).toBeTruthy()
        expect(p.mergeRate).toBeGreaterThanOrEqual(0)
        expect(p.mergeRate).toBeLessThanOrEqual(1)
      })
    })

    it('is deterministic', async () => {
      expect(await getOutcomesMetrics('30d')).toEqual(await getOutcomesMetrics('30d'))
    })
  })

  describe('getCostMetrics', () => {
    it('has all 4 required KPIs', async () => {
      const m = await getCostMetrics('30d')
      expect(m.kpis).toHaveProperty('totalSpend')
      expect(m.kpis).toHaveProperty('costPerTask')
      expect(m.kpis).toHaveProperty('costPerMergedPr')
      expect(m.kpis).toHaveProperty('tokenWastePct')
    })

    it('totalSpend is positive', async () => {
      const m = await getCostMetrics('90d')
      expect(m.kpis.totalSpend.value).toBeGreaterThan(0)
    })

    it('budgetBurnPct is between 0 and 100', async () => {
      const m = await getCostMetrics('30d')
      expect(m.budgetBurnPct).toBeGreaterThanOrEqual(0)
      expect(m.budgetBurnPct).toBeLessThanOrEqual(100)
    })

    it('costPerMergedPrByTaskType covers all 6 task types', async () => {
      const m = await getCostMetrics('90d')
      expect(m.costPerMergedPrByTaskType).toHaveLength(6)
    })

    it('teamBreakdown has 4 entries', async () => {
      const m = await getCostMetrics('90d')
      expect(m.teamBreakdown).toHaveLength(4)
    })

    it('spendTrend has period-length entries', async () => {
      const m = await getCostMetrics('7d')
      expect(m.spendTrend).toHaveLength(7)
    })

    it('is deterministic', async () => {
      expect(await getCostMetrics('30d')).toEqual(await getCostMetrics('30d'))
    })
  })

  describe('getReliabilityMetrics', () => {
    it('has all 4 required KPIs', async () => {
      const m = await getReliabilityMetrics('30d')
      expect(m.kpis).toHaveProperty('p95TaskDurationMs')
      expect(m.kpis).toHaveProperty('toolFailureRate')
      expect(m.kpis).toHaveProperty('timeoutRate')
      expect(m.kpis).toHaveProperty('envSetupP95Ms')
    })

    it('p95TaskDurationMs is positive', async () => {
      const m = await getReliabilityMetrics('30d')
      expect(m.kpis.p95TaskDurationMs.value).toBeGreaterThan(0)
    })

    it('durationTrend has period-length entries with p50 and p95', async () => {
      const m = await getReliabilityMetrics('7d')
      expect(m.durationTrend).toHaveLength(7)
      m.durationTrend.forEach(d => {
        expect(d).toHaveProperty('date')
        expect(d).toHaveProperty('p50')
        expect(d).toHaveProperty('p95')
      })
    })

    it('errorRateByCategory has period-length entries', async () => {
      const m = await getReliabilityMetrics('30d')
      expect(m.errorRateByCategory).toHaveLength(30)
    })

    it('toolPerformance has entries for all 6 span types', async () => {
      const m = await getReliabilityMetrics('90d')
      expect(m.toolPerformance).toHaveLength(6)
    })

    it('is deterministic', async () => {
      expect(await getReliabilityMetrics('30d')).toEqual(await getReliabilityMetrics('30d'))
    })
  })

  describe('getGovernanceMetrics', () => {
    it('has all 3 required KPIs', async () => {
      const m = await getGovernanceMetrics('30d')
      expect(m.kpis).toHaveProperty('policyBlocks')
      expect(m.kpis).toHaveProperty('secretsDetected')
      expect(m.kpis).toHaveProperty('humanApprovalsRequired')
    })

    it('events array is non-empty for 90d', async () => {
      const m = await getGovernanceMetrics('90d')
      expect(Array.isArray(m.events)).toBe(true)
      expect(m.events.length).toBeGreaterThan(0)
    })

    it('90d returns more events than 7d', async () => {
      const m90 = await getGovernanceMetrics('90d')
      const m7 = await getGovernanceMetrics('7d')
      expect(m90.events.length).toBeGreaterThan(m7.events.length)
    })

    it('eventsOverTime has period-length entries with all 3 event type keys', async () => {
      const m = await getGovernanceMetrics('30d')
      expect(m.eventsOverTime).toHaveLength(30)
      m.eventsOverTime.forEach(row => {
        expect(row).toHaveProperty('date')
        expect(row).toHaveProperty('policy_block')
        expect(row).toHaveProperty('secret_detected')
        expect(row).toHaveProperty('human_approval_required')
      })
    })

    it('is deterministic', async () => {
      expect(await getGovernanceMetrics('30d')).toEqual(await getGovernanceMetrics('30d'))
    })
  })

  describe('getTeamDetail', () => {
    it('returns the correct team', async () => {
      const d = await getTeamDetail('team-platform', '30d')
      expect(d.team.id).toBe('team-platform')
      expect(d.team.name).toBe('Platform')
    })

    it('has all 4 section keys', async () => {
      const d = await getTeamDetail('team-platform', '30d')
      expect(d.sections).toHaveProperty('outcomes')
      expect(d.sections).toHaveProperty('cost')
      expect(d.sections).toHaveProperty('reliability')
      expect(d.sections).toHaveProperty('governance')
    })

    it('all members belong to the team', async () => {
      const d = await getTeamDetail('team-platform', '90d')
      expect(d.members.length).toBeGreaterThan(0)
      d.members.forEach(u => expect(u.teamId).toBe('team-platform'))
    })

    it('spendUsd is non-negative', async () => {
      const d = await getTeamDetail('team-mobile', '90d')
      expect(d.spendUsd).toBeGreaterThanOrEqual(0)
    })

    it('is deterministic', async () => {
      expect(await getTeamDetail('team-platform', '30d')).toEqual(await getTeamDetail('team-platform', '30d'))
    })
  })

  describe('getRepoDetail', () => {
    it('returns the correct repo', async () => {
      const d = await getRepoDetail('repo-platform-core', '30d')
      expect(d.repo.id).toBe('repo-platform-core')
      expect(d.repo.name).toBe('platform-core')
    })

    it('has all 4 section keys', async () => {
      const d = await getRepoDetail('repo-platform-core', '30d')
      expect(d.sections).toHaveProperty('outcomes')
      expect(d.sections).toHaveProperty('cost')
      expect(d.sections).toHaveProperty('reliability')
      expect(d.sections).toHaveProperty('governance')
    })

    it('autonomyRate is between 0 and 1', async () => {
      const d = await getRepoDetail('repo-platform-core', '90d')
      expect(d.autonomyRate).toBeGreaterThanOrEqual(0)
      expect(d.autonomyRate).toBeLessThanOrEqual(1)
    })

    it('is deterministic', async () => {
      expect(await getRepoDetail('repo-platform-core', '30d')).toEqual(await getRepoDetail('repo-platform-core', '30d'))
    })
  })
})
