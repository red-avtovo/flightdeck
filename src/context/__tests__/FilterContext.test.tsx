import type { ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import {
  FilterProvider,
  useFilterContext,
  initFilterState,
  filterActionsFromSearch,
} from '../FilterContext'
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

// FilterProvider syncs from the router, so its tests need a Router ancestor.
function renderInProvider(ui: ReactNode) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <FilterProvider>{ui}</FilterProvider>
    </MemoryRouter>,
  )
}

describe('FilterContext', () => {
  describe('initFilterState', () => {
    it('defaults when query string is empty', () => {
      expect(initFilterState('')).toEqual({ period: '30d', teamId: null, model: null })
    })

    it('seeds teamId from the team query param', () => {
      expect(initFilterState('?team=team-mobile')).toEqual({
        period: '30d',
        teamId: 'team-mobile',
        model: null,
      })
    })

    it('seeds period and model from query params', () => {
      expect(initFilterState('?period=7d&model=claude-opus-4')).toEqual({
        period: '7d',
        teamId: null,
        model: 'claude-opus-4',
      })
    })

    it('ignores an invalid period and falls back to the default', () => {
      expect(initFilterState('?period=bogus').period).toBe('30d')
    })

    it('treats an empty team param as no selection', () => {
      expect(initFilterState('?team=').teamId).toBeNull()
    })
  })

  describe('filterActionsFromSearch', () => {
    it('returns no actions for an empty query string', () => {
      expect(filterActionsFromSearch('')).toEqual([])
    })

    it('emits a SET_TEAM action for a present team param', () => {
      expect(filterActionsFromSearch('?team=team-mobile')).toEqual([
        { type: 'SET_TEAM', teamId: 'team-mobile' },
      ])
    })

    it('emits SET_TEAM with null for an empty team param', () => {
      expect(filterActionsFromSearch('?team=')).toEqual([{ type: 'SET_TEAM', teamId: null }])
    })

    it('emits period and model actions when present', () => {
      expect(filterActionsFromSearch('?period=7d&model=claude-opus-4')).toEqual([
        { type: 'SET_PERIOD', period: '7d' },
        { type: 'SET_MODEL', model: 'claude-opus-4' },
      ])
    })

    it('skips an invalid period param', () => {
      expect(filterActionsFromSearch('?period=bogus')).toEqual([])
    })

    it('leaves filters untouched when params are absent', () => {
      // A param-less navigation (e.g. /overview) must not reset existing filters.
      expect(filterActionsFromSearch('?model=claude-opus-4')).toEqual([
        { type: 'SET_MODEL', model: 'claude-opus-4' },
      ])
    })
  })

  describe('URL sync on client-side navigation', () => {
    function NavComponent() {
      const filters = useFilters()
      const navigate = useNavigate()
      return (
        <div>
          <div data-testid="teamId">{filters.teamId ?? 'null'}</div>
          <button onClick={() => navigate('/reliability?team=team-mobile')}>Go Mobile</button>
          <button onClick={() => navigate('/overview')}>Go Overview</button>
        </div>
      )
    }

    it('updates the team filter when navigating to a URL carrying ?team', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/overview']}>
          <FilterProvider>
            <NavComponent />
          </FilterProvider>
        </MemoryRouter>,
      )
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
      await user.click(screen.getByRole('button', { name: 'Go Mobile' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('team-mobile')
    })

    it('keeps the team filter when navigating to a param-less route', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter initialEntries={['/overview']}>
          <FilterProvider>
            <NavComponent />
          </FilterProvider>
        </MemoryRouter>,
      )
      await user.click(screen.getByRole('button', { name: 'Go Mobile' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('team-mobile')
      await user.click(screen.getByRole('button', { name: 'Go Overview' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('team-mobile')
    })
  })

  describe('FilterProvider', () => {
    it('renders children', () => {
      renderInProvider(<div>Test Content</div>)
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })
  })

  describe('useFilters hook', () => {
    it('provides initial state', () => {
      renderInProvider(<TestComponent />)
      expect(screen.getByTestId('period')).toHaveTextContent('30d')
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
      expect(screen.getByTestId('model')).toHaveTextContent('null')
    })

    it('updates period when setPeriod is called', async () => {
      const user = userEvent.setup()
      renderInProvider(<TestComponent />)
      expect(screen.getByTestId('period')).toHaveTextContent('30d')
      await user.click(screen.getByRole('button', { name: 'Set Period 7d' }))
      expect(screen.getByTestId('period')).toHaveTextContent('7d')
      await user.click(screen.getByRole('button', { name: 'Set Period 90d' }))
      expect(screen.getByTestId('period')).toHaveTextContent('90d')
    })

    it('updates teamId when setTeamId is called', async () => {
      const user = userEvent.setup()
      renderInProvider(<TestComponent />)
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
      await user.click(screen.getByRole('button', { name: 'Set Team 1' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('team-1')
      await user.click(screen.getByRole('button', { name: 'Clear Team' }))
      expect(screen.getByTestId('teamId')).toHaveTextContent('null')
    })

    it('updates model when setModel is called', async () => {
      const user = userEvent.setup()
      renderInProvider(<TestComponent />)
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

      renderInProvider(<DebugComponent />)
      expect(screen.getByTestId('context-period')).toHaveTextContent('30d')
      expect(screen.getByTestId('context-available')).toHaveTextContent('true')
    })
  })
})
