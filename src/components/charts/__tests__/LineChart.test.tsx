import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LineChart } from '../LineChart'

const mockData = [
  { date: '2024-01', value: 10 },
  { date: '2024-02', value: 20 },
  { date: '2024-03', value: 15 },
]

const mockSeries = [{ key: 'value', label: 'Value', color: '#6366f1' }]

const multiData = [
  { date: '2024-01', tool_error: 3, timeout: 1, env_setup: 2 },
  { date: '2024-02', tool_error: 5, timeout: 2, env_setup: 1 },
]
const multiSeries = [
  { key: 'tool_error', label: 'Tool Error', color: '#6366f1' },
  { key: 'timeout', label: 'Timeout', color: '#f43f5e' },
  { key: 'env_setup', label: 'Env Setup', color: '#f59e0b' },
]

describe('LineChart', () => {
  it('renders empty state when data is empty', () => {
    render(<LineChart data={[]} series={mockSeries} />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('renders responsive container when data is provided', () => {
    render(<LineChart data={mockData} series={mockSeries} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders without throwing', () => {
    expect(() =>
      render(<LineChart data={mockData} series={mockSeries} />),
    ).not.toThrow()
  })

  describe('toggleable legend', () => {
    it('renders no toggle legend by default', () => {
      render(<LineChart data={multiData} series={multiSeries} />)
      expect(screen.queryByRole('group', { name: /toggle series/i })).not.toBeInTheDocument()
    })

    it('renders a pressed toggle chip per series when toggleable', () => {
      render(<LineChart data={multiData} series={multiSeries} toggleable />)
      const legend = screen.getByRole('group', { name: /toggle series/i })
      const chips = within(legend).getAllByRole('button')
      expect(chips).toHaveLength(3)
      chips.forEach(chip => expect(chip).toHaveAttribute('aria-pressed', 'true'))
      expect(within(legend).getByRole('button', { name: 'Tool Error' })).toBeInTheDocument()
    })

    it('toggles a series off and back on when its chip is clicked', async () => {
      const user = userEvent.setup()
      render(<LineChart data={multiData} series={multiSeries} toggleable />)
      const chip = screen.getByRole('button', { name: 'Timeout' })

      await user.click(chip)
      expect(chip).toHaveAttribute('aria-pressed', 'false') // hidden

      await user.click(chip)
      expect(chip).toHaveAttribute('aria-pressed', 'true')  // shown again
    })
  })
})
