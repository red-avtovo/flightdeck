import type { Meta, StoryObj } from '@storybook/react'
import { BudgetGauge } from './BudgetGauge'

const meta: Meta<typeof BudgetGauge> = {
  title: 'Charts/BudgetGauge',
  component: BudgetGauge,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof BudgetGauge>

// Normal: < 75% — arc and value text render in emerald
export const Normal:     Story = { args: { spentUsd: 5000,  budgetUsd: 10000 } }
// Warning: 75–90% — arc and value text render in amber ("Approaching budget")
export const Warning:    Story = { args: { spentUsd: 8500,  budgetUsd: 10000 } }
// OverBudget: > 90% — arc and value text render in rose ("Over budget", per FR-04)
export const OverBudget: Story = { args: { spentUsd: 9500,  budgetUsd: 10000 } }
