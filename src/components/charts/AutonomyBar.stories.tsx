import type { Meta, StoryObj } from '@storybook/react'
import { AutonomyBar } from './AutonomyBar'

const meta: Meta<typeof AutonomyBar> = {
  title: 'Charts/AutonomyBar',
  component: AutonomyBar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AutonomyBar>

export const AllBands: Story = {
  args: {
    breakdown: { autonomous: 0.40, human_assisted: 0.30, human_rescued: 0.18, failed: 0.12 },
  },
}

export const SingleBand: Story = {
  args: {
    breakdown: { autonomous: 1.0, human_assisted: 0, human_rescued: 0, failed: 0 },
  },
}

export const ActiveBand: Story = {
  args: {
    breakdown: { autonomous: 0.40, human_assisted: 0.30, human_rescued: 0.18, failed: 0.12 },
    activeBand: 'autonomous',
  },
}
