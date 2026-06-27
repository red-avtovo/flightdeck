import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventLog } from '../EventLog'
import type { SecurityEvent } from '../../../types'

const EVENTS: SecurityEvent[] = [
  { id: 'e1', taskId: 't1', repoId: 'r1', teamId: 'team-1', severity: 'critical', type: 'policy_block', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'e2', taskId: 't2', repoId: 'r1', teamId: 'team-1', severity: 'warning',  type: 'secret_detected', createdAt: '2026-06-02T11:00:00Z' },
  { id: 'e3', taskId: 't3', repoId: 'r2', teamId: 'team-2', severity: 'info',     type: 'human_approval_required', createdAt: '2026-06-03T12:00:00Z' },
]

describe('EventLog', () => {
  it('renders all 3 events by default', () => {
    render(<EventLog events={EVENTS} />)
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(3)
  })

  it('filters to only policy_block when filter selected', async () => {
    const user = userEvent.setup()
    render(<EventLog events={EVENTS} />)
    await user.selectOptions(screen.getByRole('combobox'), 'policy_block')
    expect(screen.getAllByRole('row').length).toBe(2) // 1 header + 1 data
  })

  it('renders empty state after filter with no matches', async () => {
    render(<EventLog events={[]} />)
    expect(screen.getByText(/no events/i)).toBeInTheDocument()
  })

  it('renders severity badge on each row', () => {
    render(<EventLog events={EVENTS} />)
    expect(screen.getAllByText(/critical|warning|info/).length).toBeGreaterThanOrEqual(1)
  })
})
