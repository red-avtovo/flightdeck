import type { Meta, StoryObj } from '@storybook/react'
import { AlertBadge } from './AlertBadge'

const meta: Meta<typeof AlertBadge> = {
  title: 'Cards/AlertBadge',
  component: AlertBadge,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof AlertBadge>

export const Critical: Story = { args: { severity: 'critical', label: 'critical' } }
export const Warning:  Story = { args: { severity: 'warning',  label: 'warning' } }
export const Info:     Story = { args: { severity: 'info',     label: 'info' } }
