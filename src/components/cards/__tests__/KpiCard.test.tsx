import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '../KpiCard'

describe('KpiCard', () => {
  it('renders formatted percent value', () => {
    render(<KpiCard title="Autonomy Rate" value={0.421} format="percent" trend={3.2} />)
    expect(screen.getByText('42.1%')).toBeInTheDocument()
  })

  it('renders formatted currency value', () => {
    render(<KpiCard title="Total Spend" value={1234.5} format="currency" trend={null} />)
    expect(screen.getByText(/\$1,234\.50/)).toBeInTheDocument()
  })

  it('shows positive trend in emerald', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={5.5} />)
    const badge = screen.getByText(/\+5\.5%/)
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/emerald|green/)
  })

  it('shows negative trend in rose', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={-3.2} />)
    const badge = screen.getByText(/-3\.2%/)
    expect(badge.className).toMatch(/rose|red/)
  })

  it('shows positive trend in rose when higherIsBetter=false', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={5.5} higherIsBetter={false} />)
    const badge = screen.getByText(/\+5\.5%/)
    expect(badge).toBeInTheDocument()
    expect(badge.className).toMatch(/rose|red/)
  })

  it('shows negative trend in emerald when higherIsBetter=false', () => {
    render(<KpiCard title="Test" value={100} format="number" trend={-3.2} higherIsBetter={false} />)
    const badge = screen.getByText(/-3\.2%/)
    expect(badge.className).toMatch(/emerald|green/)
  })

  it('renders without error when sparkline is empty', () => {
    expect(() =>
      render(<KpiCard title="Test" value={42} format="number" trend={null} sparkline={[]} />),
    ).not.toThrow()
  })

  it('shows loading skeleton when loading=true', () => {
    render(<KpiCard title="Test" value={0} format="number" trend={null} loading />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
