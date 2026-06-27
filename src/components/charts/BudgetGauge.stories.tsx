import type { Meta, StoryObj } from '@storybook/react'
import { BudgetGauge } from './BudgetGauge'

const meta: Meta<typeof BudgetGauge> = {
  title: 'Charts/BudgetGauge',
  component: BudgetGauge,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof BudgetGauge>

export const Normal:     Story = { args: { spentUsd: 5000,  budgetUsd: 10000 } }
export const Warning:    Story = { args: { spentUsd: 9000,  budgetUsd: 10000 } }
export const OverBudget: Story = { args: { spentUsd: 11000, budgetUsd: 10000 } }
