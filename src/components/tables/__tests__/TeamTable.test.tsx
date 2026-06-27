import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TeamTable } from '../TeamTable'
import type { TeamMetrics } from '../../../types'

const MOCK_ROWS: TeamMetrics[] = [
  { teamId: 'team-platform', teamName: 'Platform', taskCount: 300, autonomyRate: 0.42, spendUsd: 15000, costPerTask: 50, costPerMergedPr: 120, tokenWastePct: 0.08 },
  { teamId: 'team-product',  teamName: 'Product',  taskCount: 200, autonomyRate: 0.38, spendUsd: 9000,  costPerTask: 45, costPerMergedPr: 100, tokenWastePct: 0.10 },
  { teamId: 'team-mobile',   teamName: 'Mobile',   taskCount: 100, autonomyRate: 0.50, spendUsd: 5000,  costPerTask: 50, costPerMergedPr: 90,  tokenWastePct: 0.05 },
]

describe('TeamTable', () => {
  it('renders 3 data rows plus header row', () => {
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    expect(screen.getAllByRole('row')).toHaveLength(4)
  })

  it('each team name is a link with href containing teamId', () => {
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    const link = screen.getByRole('link', { name: 'Platform' })
    expect(link).toHaveAttribute('href', expect.stringContaining('team-platform'))
  })

  it('clicking Spend header sorts ascending then descending', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><TeamTable rows={MOCK_ROWS} /></MemoryRouter>)
    const spendHeader = screen.getByRole('button', { name: /spend/i })
    await user.click(spendHeader)
    const rows = screen.getAllByRole('row').slice(1)
    const firstSpend = rows[0].textContent
    await user.click(spendHeader)
    const rowsAfter = screen.getAllByRole('row').slice(1)
    expect(rowsAfter[0].textContent).not.toBe(firstSpend)
  })

  it('renders empty state when rows is empty', () => {
    render(<MemoryRouter><TeamTable rows={[]} /></MemoryRouter>)
    expect(screen.getByText(/no teams found/i)).toBeInTheDocument()
  })
})
