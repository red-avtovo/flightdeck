import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskList } from '../TaskList'
import type { AgentTask } from '../../../types'

const makeTask = (overrides: Partial<AgentTask> = {}): AgentTask => ({
  id: 'task-1', orgId: 'org-1', teamId: 'team-1', repoId: 'repo-1', userId: 'user-1',
  taskType: 'bug_fix', status: 'completed', startedAt: '2026-06-01T10:00:00Z',
  completedAt: '2026-06-01T10:30:00Z', model: 'claude-sonnet-4-6',
  inputTokens: 1000, outputTokens: 500, costUsd: 0.05,
  toolCallCount: 10, failedToolCallCount: 0, policyBlockCount: 0,
  humanInterventionRequired: false, prId: 'pr-1', autonomyBand: 'autonomous',
  ...overrides,
})

describe('TaskList', () => {
  it('renders at least 5 rows when given 5 tasks', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => makeTask({ id: `task-${i}` }))
    render(<TaskList tasks={tasks} onTaskClick={vi.fn()} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(5)
  })

  it('calls onTaskClick when a row is clicked', async () => {
    const user = userEvent.setup()
    const onTaskClick = vi.fn()
    const task = makeTask()
    render(<TaskList tasks={[task]} onTaskClick={onTaskClick} />)
    await user.click(screen.getAllByRole('row')[1])
    expect(onTaskClick).toHaveBeenCalledWith(task)
  })

  it('renders empty state when tasks is empty', () => {
    render(<TaskList tasks={[]} onTaskClick={vi.fn()} />)
    expect(screen.getByText(/no tasks/i)).toBeInTheDocument()
  })

  it('shows failed status badge for failed tasks', () => {
    render(<TaskList tasks={[makeTask({ status: 'failed', autonomyBand: 'failed' })]} onTaskClick={vi.fn()} />)
    expect(screen.getAllByText(/failed/i).length).toBeGreaterThanOrEqual(1)
  })
})
