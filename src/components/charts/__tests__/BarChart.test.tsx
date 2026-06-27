import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BarChart } from '../BarChart'

const mockData = [
  { name: 'Team A', value: 10 },
  { name: 'Team B', value: 20 },
]

const mockSeries = [{ key: 'value', label: 'Value', color: '#6366f1' }]

describe('BarChart', () => {
  it('renders empty state when data is empty', () => {
    render(<BarChart data={[]} series={mockSeries} />)
    expect(screen.getByText(/no data/i)).toBeInTheDocument()
  })

  it('renders responsive container when data is provided', () => {
    render(<BarChart data={mockData} series={mockSeries} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('renders without throwing', () => {
    expect(() =>
      render(<BarChart data={mockData} series={mockSeries} />),
    ).not.toThrow()
  })
})
