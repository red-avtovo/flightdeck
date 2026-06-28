import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { OutcomeTable } from '../OutcomeTable'
import type { OutcomesMetrics } from '../../../types'

type Row = OutcomesMetrics['prOutcomes'][number]

const row = (over: Partial<Row>): Row => ({
  repoId: 'repo-x',
  taskType: 'feature',
  mergeRate: 0.9,
  avgEditDistancePct: 10,
  ciFirstAttemptPassRate: 0.9,
  ...over,
})

describe('OutcomeTable traffic-light coloring', () => {
  // Regression: numeric cells must carry ONLY their rateColor() class, never a base
  // text-slate color. Two competing `text-*` utilities tie on specificity, and once
  // `slate` became a custom (extended) color it began winning by stylesheet order —
  // graying out every number. The cell color must come from rateColor alone.
  it('colors a good merge rate green, not slate', () => {
    render(<OutcomeTable rows={[row({ mergeRate: 0.95 })]} />)
    const cell = screen.getByText('95.0%')
    expect(cell.className).toContain('text-emerald-300')
    expect(cell.className).not.toContain('text-slate-300')
  })

  it('colors a poor CI pass rate red', () => {
    render(<OutcomeTable rows={[row({ ciFirstAttemptPassRate: 0.2 })]} />)
    const cell = screen.getByText('20.0%')
    expect(cell.className).toContain('text-rose-300')
  })

  it('flips the scale for edit distance (low is good = green)', () => {
    render(<OutcomeTable rows={[row({ avgEditDistancePct: 5 })]} />)
    const cell = screen.getByText('5.0%')
    expect(cell.className).toContain('text-emerald-300')
  })

  it('colors a high edit distance red (more rework is bad)', () => {
    render(<OutcomeTable rows={[row({ avgEditDistancePct: 60 })]} />)
    const cell = screen.getByText('60.0%')
    expect(cell.className).toContain('text-rose-300')
  })
})

describe('OutcomeTable sorting', () => {
  const rows = [
    row({ repoId: 'repo-low', mergeRate: 0.2 }),
    row({ repoId: 'repo-high', mergeRate: 0.95 }),
  ]
  const firstRepo = () => within(screen.getAllByRole('row')[1]).getByText(/^repo-/).textContent

  it('defaults to merge rate descending and toggles to ascending on re-click', async () => {
    const user = userEvent.setup()
    render(<OutcomeTable rows={rows} />)
    // Default sort is mergeRate desc → highest row first.
    expect(firstRepo()).toBe('repo-high')

    // Re-clicking the active column flips direction → lowest row first.
    await user.click(screen.getByRole('button', { name: 'Sort by Merge Rate' }))
    expect(firstRepo()).toBe('repo-low')
  })

  it('switches the sort column when a different header is clicked', async () => {
    const user = userEvent.setup()
    render(
      <OutcomeTable
        rows={[
          row({ repoId: 'repo-a', mergeRate: 0.9, ciFirstAttemptPassRate: 0.1 }),
          row({ repoId: 'repo-b', mergeRate: 0.1, ciFirstAttemptPassRate: 0.9 }),
        ]}
      />,
    )
    // New column sorts desc → highest CI pass rate first.
    await user.click(screen.getByRole('button', { name: 'Sort by CI Pass (1st)' }))
    expect(firstRepo()).toBe('repo-b')
  })
})
