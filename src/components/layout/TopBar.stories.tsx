import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { TopBar } from './TopBar'

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof TopBar>

// OrgPage: shows the Period button group + Team + Model filter pills (non-drill-down path)
export const OrgPage: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter
        initialEntries={['/overview']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <FilterProvider>
          <Story />
        </FilterProvider>
      </MemoryRouter>
    ),
  ],
}

// DrillDown: shows the Period button group only (team/repo drill-down path)
export const DrillDown: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter
        initialEntries={['/teams/team-platform']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <FilterProvider>
          <Story />
        </FilterProvider>
      </MemoryRouter>
    ),
  ],
}
