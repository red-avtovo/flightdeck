import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FilterProvider } from '../../../context/FilterContext'
import { TopBar } from '../TopBar'

describe('TopBar', () => {
  function setup(initialPath = '/overview') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <FilterProvider>
          <TopBar />
        </FilterProvider>
      </MemoryRouter>,
    )
  }

  it('renders the TopBar with proper accessibility attributes', () => {
    setup()
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header.tagName).toBe('HEADER')
  })

  it('displays the organization name "Acme Corp"', () => {
    setup()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('displays page title "Overview" on /overview', () => {
    setup('/overview')
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  it('displays page title "Cost & Efficiency" on /cost', () => {
    setup('/cost')
    expect(screen.getByText('Cost & Efficiency')).toBeInTheDocument()
  })

  it('displays page title "Outcomes & Quality" on /outcomes', () => {
    setup('/outcomes')
    expect(screen.getByText('Outcomes & Quality')).toBeInTheDocument()
  })

  it('displays page title "Reliability & Traces" on /reliability', () => {
    setup('/reliability')
    expect(screen.getByText('Reliability & Traces')).toBeInTheDocument()
  })

  it('displays page title "Governance & Audit" on /governance', () => {
    setup('/governance')
    expect(screen.getByText('Governance & Audit')).toBeInTheDocument()
  })

  it('displays "Team drill-down" title on team routes', () => {
    setup('/teams/team-platform')
    expect(screen.getByText('Team drill-down')).toBeInTheDocument()
  })

  it('displays "Repo drill-down" title on repo routes', () => {
    setup('/repos/my-repo')
    expect(screen.getByText('Repo drill-down')).toBeInTheDocument()
  })

  it('renders the period button group', () => {
    setup()
    const periodGroup = screen.getByRole('group', { name: /time range/i })
    expect(periodGroup).toBeInTheDocument()
  })

  it('displays period buttons (7d, 30d, 90d)', () => {
    setup()
    const periodGroup = screen.getByRole('group', { name: /time range/i })
    expect(within(periodGroup).getByRole('button', { name: '7d' })).toBeInTheDocument()
    expect(within(periodGroup).getByRole('button', { name: '30d' })).toBeInTheDocument()
    expect(within(periodGroup).getByRole('button', { name: '90d' })).toBeInTheDocument()
  })

  it('marks the current period button as pressed', () => {
    setup()
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '7d' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders the team select dropdown on dashboard routes', () => {
    setup()
    const teamSelect = screen.getByRole('combobox', { name: /team/i })
    expect(teamSelect).toBeInTheDocument()
  })

  it('displays team options', () => {
    setup()
    const teamSelect = screen.getByRole('combobox', { name: /team/i }) as HTMLSelectElement
    const labels = Array.from(teamSelect.options).map(o => o.textContent)
    expect(labels).toContain('All teams')
    expect(labels).toContain('Platform')
    expect(labels).toContain('Product')
    expect(labels).toContain('Data Science')
    expect(labels).toContain('Mobile')
  })

  it('renders the model select dropdown on dashboard routes', () => {
    setup()
    const modelSelect = screen.getByRole('combobox', { name: /model/i })
    expect(modelSelect).toBeInTheDocument()
  })

  it('displays model options', () => {
    setup()
    const modelSelect = screen.getByRole('combobox', { name: /model/i }) as HTMLSelectElement
    const labels = Array.from(modelSelect.options).map(o => o.textContent)
    expect(labels).toContain('All models')
    expect(labels).toContain('Opus 4')
    expect(labels).toContain('Sonnet 4.6')
    expect(labels).toContain('Haiku 4.5')
  })

  it('hides team and model selectors on team drill-down routes (FR-09)', () => {
    setup('/teams/team-platform')
    expect(screen.queryByRole('combobox', { name: /team/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /model/i })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /time range/i })).toBeInTheDocument()
  })

  it('hides team and model selectors on repo drill-down routes (FR-09)', () => {
    setup('/repos/my-repo')
    expect(screen.queryByRole('combobox', { name: /team/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /model/i })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: /time range/i })).toBeInTheDocument()
  })

  it('changes period when a period button is clicked', async () => {
    const user = userEvent.setup()
    setup()
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '7d' }))
    expect(screen.getByRole('button', { name: '7d' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('changes team when team select is changed', async () => {
    const user = userEvent.setup()
    setup()
    const teamSelect = screen.getByRole('combobox', { name: /team/i }) as HTMLSelectElement
    expect(teamSelect.value).toBe('')
    await user.selectOptions(teamSelect, 'team-platform')
    expect(teamSelect.value).toBe('team-platform')
  })

  it('changes model when model select is changed', async () => {
    const user = userEvent.setup()
    setup()
    const modelSelect = screen.getByRole('combobox', { name: /model/i }) as HTMLSelectElement
    expect(modelSelect.value).toBe('')
    await user.selectOptions(modelSelect, 'claude-opus-4')
    expect(modelSelect.value).toBe('claude-opus-4')
  })

  it('has proper styling classes applied to the header', () => {
    setup()
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('fixed')
    expect(header).toHaveClass('top-0')
    expect(header).toHaveClass('bg-slate-900')
    expect(header).toHaveClass('h-16')
  })

  it('renders the period group plus team and model selects on dashboard routes', () => {
    setup()
    expect(screen.getByRole('group', { name: /time range/i })).toBeInTheDocument()
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(2)
    selects.forEach(select => {
      expect(select).toHaveClass('rounded')
    })
  })

  it('renders the period group and no selects on drill-down routes', () => {
    setup('/teams/team-platform')
    expect(screen.getByRole('group', { name: /time range/i })).toBeInTheDocument()
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })

  it('aligns the three controls on a shared height (Period group + Team/Model pills)', () => {
    setup()
    // All three actionable controls must share one height token so they line up;
    // the Team/Model pills previously rendered shorter than the Period group.
    const periodGroup = screen.getByRole('group', { name: /time range/i })
    const teamPill = screen.getByRole('combobox', { name: /team/i }).closest('div.rounded-full')
    const modelPill = screen.getByRole('combobox', { name: /model/i }).closest('div.rounded-full')
    expect(periodGroup).toHaveClass('h-9')
    expect(teamPill).toHaveClass('h-9')
    expect(modelPill).toHaveClass('h-9')
  })
})
