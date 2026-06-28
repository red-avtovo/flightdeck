import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BudgetGauge } from '../BudgetGauge'

describe('BudgetGauge', () => {
  it('renders the spent percentage', () => {
    render(<BudgetGauge spentUsd={5000} budgetUsd={10000} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('is in the normal (emerald) state below 75%', () => {
    const { container } = render(<BudgetGauge spentUsd={5000} budgetUsd={10000} />)
    expect(container.querySelector('[data-state="normal"]')).toBeInTheDocument()
    expect(screen.queryByText('Approaching budget')).toBeNull()
    expect(screen.queryByText('Over budget')).toBeNull()
  })

  it('shows the amber warning state and label between 75% and 90%', () => {
    const { container } = render(<BudgetGauge spentUsd={8500} budgetUsd={10000} />)
    expect(container.querySelector('[data-state="warning"]')).toBeInTheDocument()
    expect(screen.getByText('Approaching budget')).toBeInTheDocument()
  })

  it('enters the warning state exactly at the 75% threshold', () => {
    const { container } = render(<BudgetGauge spentUsd={7500} budgetUsd={10000} />)
    expect(container.querySelector('[data-state="warning"]')).toBeInTheDocument()
  })

  it('shows the danger state and "Over budget" text above 90% (FR-04)', () => {
    const { container } = render(<BudgetGauge spentUsd={11000} budgetUsd={10000} />)
    expect(screen.getByText('110%')).toBeInTheDocument()
    expect(screen.getByText('Over budget')).toBeInTheDocument()
    expect(container.querySelector('[data-state="danger"]')).toBeInTheDocument()
  })
})
