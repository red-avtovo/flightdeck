import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AutonomyBar } from '../AutonomyBar'
import type { AutonomyBand } from '../../../types'

const fullBreakdown: Record<AutonomyBand, number> = {
  autonomous: 0.6,
  human_assisted: 0.25,
  human_rescued: 0.1,
  failed: 0.05,
}

describe('AutonomyBar', () => {
  it('renders with data-testid="autonomy-bar"', () => {
    render(<AutonomyBar breakdown={fullBreakdown} />)
    expect(screen.getByTestId('autonomy-bar')).toBeInTheDocument()
  })

  it('renders all four band segments when all are non-zero', () => {
    render(<AutonomyBar breakdown={fullBreakdown} />)
    expect(screen.getByRole('button', { name: /autonomous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /human-assisted/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /human-rescued/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /failed/i })).toBeInTheDocument()
  })

  it('each segment aria-label includes band name and percentage', () => {
    render(<AutonomyBar breakdown={fullBreakdown} />)
    expect(screen.getByRole('button', { name: /autonomous.*60\.0%/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /human-assisted.*25\.0%/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /human-rescued.*10\.0%/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /failed.*5\.0%/i })).toBeInTheDocument()
  })

  it('does not render a button for a zero-value band', () => {
    const breakdown: Record<AutonomyBand, number> = {
      autonomous: 0.9,
      human_assisted: 0.1,
      human_rescued: 0,
      failed: 0,
    }
    render(<AutonomyBar breakdown={breakdown} />)
    expect(screen.queryByRole('button', { name: /human-rescued/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /failed/i })).toBeNull()
  })

  it('calls onBandClick with band key when segment is clicked', async () => {
    const user = userEvent.setup()
    const onBandClick = vi.fn()
    render(<AutonomyBar breakdown={fullBreakdown} onBandClick={onBandClick} />)
    await user.click(screen.getByRole('button', { name: /autonomous/i }))
    expect(onBandClick).toHaveBeenCalledWith('autonomous')
  })

  it('calls onBandClick with null when clicking the active band (deselect)', async () => {
    const user = userEvent.setup()
    const onBandClick = vi.fn()
    render(<AutonomyBar breakdown={fullBreakdown} onBandClick={onBandClick} activeBand="autonomous" />)
    await user.click(screen.getByRole('button', { name: /autonomous/i }))
    expect(onBandClick).toHaveBeenCalledWith(null)
  })

  it('marks active band segment as aria-pressed=true', () => {
    render(<AutonomyBar breakdown={fullBreakdown} activeBand="autonomous" />)
    const btn = screen.getByRole('button', { name: /autonomous/i })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks inactive band segment as aria-pressed=false', () => {
    render(<AutonomyBar breakdown={fullBreakdown} activeBand="autonomous" />)
    const btn = screen.getByRole('button', { name: /human-assisted/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders legend with percentages for all bands', () => {
    render(<AutonomyBar breakdown={fullBreakdown} />)
    expect(screen.getByText('60.0%')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
    expect(screen.getByText('10.0%')).toBeInTheDocument()
    expect(screen.getByText('5.0%')).toBeInTheDocument()
  })

  it('does not throw when onBandClick is not provided', async () => {
    const user = userEvent.setup()
    render(<AutonomyBar breakdown={fullBreakdown} />)
    await expect(
      user.click(screen.getByRole('button', { name: /autonomous/i })),
    ).resolves.not.toThrow()
  })
})
