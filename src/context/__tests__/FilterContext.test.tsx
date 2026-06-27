import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterProvider, useFilterContext } from '../FilterContext'
import { useFilters } from '../../hooks/useFilters'

function TestComponent() {
  const filters = useFilters()
  return (
    <div>
      <div data-testid="period">{filters.period}</div>
      <div data-testid="teamId">{filters.teamId ?? 'null'}</div>
      <div data-testid="model">{filters.model ?? 'null'}</div>
      <button onClick={() => filters.setPeriod('7d')}>Set Period 7d</button>
      <button onClick={() => filters.setPeriod('30d')}>Set Period 30d</button>
      <button onClick={() => filters.setPeriod('90d')}>Set Period 90d</button>
      <button onClick={() => filters.setTeamId('team-1')}>Set Team 1</button>
      <button onClick={() => filters.setTeamId(null)}>Clear Team</button>
      <button onClick={() => filters.setModel('gpt-4')}>Set Model GPT-4</button>
      <button onClick={() => filters.setModel(null)}>Clear Model</button>
    </div>
  )
}

function ContextErrorComponent() {
  const ctx = useFilterContext()
  return <div>{ctx.state.period}</div>
}

describe('FilterContext', () => {
  describe('FilterProvider', () => {
    it('renders children', () => {
      render(
        <FilterProvider>
          <div>Test Content</div>
        </FilterProvider>,
      )
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('useFilters hook', () => {
    it('provides initial state', () => {
      render(
        <FilterProvider>
          <TestComponent />
        </FilterProvider>,
      )
      expect(screen.getByTestId('period')).toHaveTextContent('30d')
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
      expect(screen.getByTestId('model')).toHaveTextContent('null')
    })

    it('updates period when setPeriod is called', async () => {
      const user = userEvent.setup()
      render(
        <FilterProvider>
          <TestComponent />
        </FilterProvider>,
      )
      expect(screen.getByTestId('period')).toHaveTextContent('30d')
      await user.click(screen.getByRole('button', { name: 'Set Period 7d' }))
      expect(screen.getByTestId('period')).toHaveTextContent('7d')
      await user.click(screen.getByRole('button', { name: 'Set Period 90d' }))
      expect(screen.getByTestId('period')).toHaveTextContent('90d')
    })

    it('updates teamId when setTeamId is called', async () => {
      const user = userEvent.setup()
      render(
        <FilterProvider>
          <TestComponent />
        </FilterProvider>,
      )
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
      await user.click(screen.getByRole('button', { name: 'Set Team 1' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('team-1')
      await user.click(screen.getByRole('button', { name: 'Clear Team' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
    })

    it('updates model when setModel is called', async () => {
      const user = userEvent.setup()
      render(
        <FilterProvider>
          <TestComponent />
        </FilterProvider>,
      )
      expect(screen.getByTestId('model')).toHaveTextContent('null')
      await user.click(screen.getByRole('button', { name: 'Set Model GPT-4' }))
      expect(screen.getByTestId('model')).toHaveTextContent('gpt-4')
      await user.click(screen.getByRole('button', { name: 'Clear Model' }))
      expect(screen.getByTestId('model')).toHaveTextContent('null')
    })
  })

  describe('useFilterContext hook', () => {
    it('throws error when used outside FilterProvider', () => {
      expect(() => {
        render(<ContextErrorComponent />)
      }).toThrow('useFilterContext must be used within FilterProvider')
    })

    it('provides state and dispatch context inside FilterProvider', () => {
      function DebugComponent() {
        const ctx = useFilterContext()
        return (
          <div>
            <div data-testid="context-period">{ctx.state.period}</div>
            <div data-testid="context-available">true</div>
          </div>
        )
      }

      render(
        <FilterProvider>
          <DebugComponent />
        </FilterProvider>,
      )
      expect(screen.getByTestId('context-period')).toHaveTextContent('30d')
      expect(screen.getByTestId('context-available')).toHaveTextContent('true')
    })
  })
})
