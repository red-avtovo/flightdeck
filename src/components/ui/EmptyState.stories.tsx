import type { Meta, StoryObj } from '@storybook/react'
import { EmptyState } from './EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {}

export const CustomMessage: Story = {
  args: {
    message: 'No tasks found for the selected filters.',
  },
}
