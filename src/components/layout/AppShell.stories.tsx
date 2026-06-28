import type { Meta, StoryObj } from '@storybook/react'
import { Routes, Route } from 'react-router-dom'
import { AppShell } from './AppShell'

// Router + FilterProvider come from the global decorator in .storybook/preview.ts.
// Render <Routes> (not a new <MemoryRouter>) so AppShell's <Outlet/> resolves
// against the global router; the active route is selected via parameters.router.
const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AppShell>

export const Default: Story = {
  parameters: { router: { initialEntries: ['/overview'] } },
  render: () => (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/overview"
          element={
            <div className="space-y-4">
              <p className="text-slate-300 text-sm font-medium">Overview page content</p>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="h-24 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs"
                  >
                    KPI card {n}
                  </div>
                ))}
              </div>
              <div className="h-48 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs">
                Chart area
              </div>
            </div>
          }
        />
      </Route>
    </Routes>
  ),
}
