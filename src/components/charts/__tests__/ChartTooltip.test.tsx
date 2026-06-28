import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartTooltip } from '../ChartTooltip'
import { formatCurrency } from '../../../lib/utils'

describe('ChartTooltip', () => {
  it('renders formatted value using formatValue prop', () => {
    const payload = [
      { value: 14.0856, name: 'Spend', color: '#f97316', dataKey: 'value' },
    ]
    const { container } = render(
      <ChartTooltip active={true} payload={payload} label="2026-06-01" formatValue={formatCurrency} />,
    )

    // Assert the formatted value appears in the rendered output
    expect(container.textContent).toContain('$14.09')
    // Assert the raw unformatted value does NOT appear
    expect(container.textContent).not.toContain('14.0856')
  })

  it('hides payload entries matching hideKey predicate', () => {
    const payload = [
      { value: 100, name: 'Value', color: '#f97316', dataKey: 'value' },
      { value: 50, name: 'Trend', color: '#f97316', dataKey: '__trend_value' },
    ]
    const { container } = render(
      <ChartTooltip
        active={true}
        payload={payload}
        label="2026-06-01"
        formatValue={formatCurrency}
        hideKey={k => k.startsWith('__trend_')}
      />,
    )

    // Assert the main value is rendered
    expect(container.textContent).toContain('Value')
    expect(container.textContent).toContain('$100.00')

    // Assert the trend overlay is NOT rendered
    expect(container.textContent).not.toContain('Trend')
    expect(screen.queryByText('Trend')).not.toBeInTheDocument()
  })

  it('returns null when not active', () => {
    const { container } = render(
      <ChartTooltip active={false} payload={[{ value: 100, name: 'Value', color: '#f97316', dataKey: 'value' }]} label="2026-06-01" />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('returns null when payload is empty', () => {
    const { container } = render(
      <ChartTooltip active={true} payload={[]} label="2026-06-01" />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders label when provided', () => {
    const payload = [{ value: 100, name: 'Value', color: '#f97316', dataKey: 'value' }]
    render(
      <ChartTooltip active={true} payload={payload} label="2026-06-01" />,
    )

    expect(screen.getByText('2026-06-01')).toBeInTheDocument()
  })

  it('renders all payload entries with their names', () => {
    const payload = [
      { value: 100, name: 'Value', color: '#f97316', dataKey: 'value' },
      { value: 50, name: 'Other', color: '#22c55e', dataKey: 'other' },
    ]
    const { container } = render(
      <ChartTooltip active={true} payload={payload} label="2026-06-01" />,
    )

    // Check that both series names are rendered
    expect(screen.getByText('Value')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()

    // Check that colour swatches are rendered (small inline-block spans)
    const swatches = container.querySelectorAll('.inline-block.h-2.w-2')
    expect(swatches.length).toBe(2)
  })
})
