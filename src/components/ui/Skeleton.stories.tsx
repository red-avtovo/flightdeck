import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {}

export const TextLine: Story = {
  args: {
    className: 'h-4 w-48',
  },
}

export const Card: Story = {
  args: {
    className: 'h-24 w-full',
  },
}

export const Large: Story = {
  args: {
    className: 'h-64 w-full',
  },
}
