import type { Meta, StoryObj } from '@storybook/react'
import { TopBar } from './TopBar'

// Router + FilterProvider come from the global decorator in .storybook/preview.ts.
// Stories pick their route via parameters.router.initialEntries — never wrap a
// second <MemoryRouter>, or React Router throws "Router inside a Router".
const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof TopBar>

// OrgPage: shows the Period button group + Team + Model filter pills (non-drill-down path)
export const OrgPage: Story = {
  parameters: { router: { initialEntries: ['/overview'] } },
}

// DrillDown: shows the Period button group only (team/repo drill-down path)
export const DrillDown: Story = {
  parameters: { router: { initialEntries: ['/teams/team-platform'] } },
}
