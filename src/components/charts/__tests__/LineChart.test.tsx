import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineChart } from '../LineChart'

const mockData = [
  { date: '2024-01', value: 10 },
  { date: '2024-02', value: 20 },
  { date: '2024-03', value: 15 },
]

const mockSeries = [{ key: 'value', label: 'Value', color: '#6366f1' }]

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
})
