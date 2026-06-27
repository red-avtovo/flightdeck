import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterProvider } from '../../../context/FilterContext'
import { TopBar } from '../TopBar'

describe('TopBar', () => {
  function setup() {
    return render(
      <FilterProvider>
        <TopBar />
      </FilterProvider>,
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

  it('renders the period select dropdown', () => {
    setup()
    const periodSelect = screen.getByRole('combobox', { name: /time range/i })
    expect(periodSelect).toBeInTheDocument()
  })

  it('displays period options (7d, 30d, 90d)', () => {
    setup()
    const periodSelect = screen.getByRole('combobox', { name: /time range/i }) as HTMLSelectElement
    expect(periodSelect.options).toHaveLength(3)
    expect(Array.from(periodSelect.options).map(o => o.value)).toEqual(['7d', '30d', '90d'])
  })

  it('sets period select value to the current period from filters', () => {
    setup()
    const periodSelect = screen.getByRole('combobox', { name: /time range/i }) as HTMLSelectElement
    expect(periodSelect.value).toBe('30d')
  })

  it('renders the team select dropdown', () => {
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

  it('renders the model select dropdown', () => {
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

  it('changes period when period select is changed', async () => {
    const user = userEvent.setup()
    setup()
    const periodSelect = screen.getByRole('combobox', { name: /time range/i }) as HTMLSelectElement
    expect(periodSelect.value).toBe('30d')
    await user.selectOptions(periodSelect, '7d')
    expect(periodSelect.value).toBe('7d')
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

  it('renders select dropdowns with proper styling', () => {
    setup()
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(3)
    selects.forEach(select => {
      expect(select).toHaveClass('rounded')
      expect(select).toHaveClass('border')
      expect(select).toHaveClass('bg-slate-800')
    })
  })
})
