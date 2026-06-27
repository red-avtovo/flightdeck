import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetGauge } from '../BudgetGauge'

describe('BudgetGauge', () => {
  it('renders 75% when spent=7500 budget=10000', () => {
    render(<BudgetGauge spentUsd={7500} budgetUsd={10000} />)
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('does not show danger class at 75%', () => {
    const { container } = render(<BudgetGauge spentUsd={7500} budgetUsd={10000} />)
    const arc = container.querySelector('[data-danger]')
    expect(arc).toBeNull()
  })

  it('renders 110% when over budget', () => {
    render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(screen.getByText('110%')).toBeInTheDocument()
  })

  it('shows danger class and "Over budget" text at 110%', () => {
    render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(screen.getByText('Over budget')).toBeInTheDocument()
    const { container } = render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(container.querySelector('[data-danger="true"]')).toBeInTheDocument()
  })
})
