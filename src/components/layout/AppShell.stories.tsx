import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { FilterProvider } from '../../context/FilterContext'
import { AppShell } from './AppShell'

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AppShell>

export const Default: Story = {
  render: () => (
    <MemoryRouter
      initialEntries={['/overview']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <FilterProvider>
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
      </FilterProvider>
    </MemoryRouter>
  ),
}
