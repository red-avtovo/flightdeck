import { createContext, useContext, useEffect, useReducer } from 'react'
import { useLocation } from 'react-router-dom'
import type { Period } from '../types'

export interface FilterState {
  period: Period
  teamId: string | null
  model: string | null
}

export type FilterAction =
  | { type: 'SET_PERIOD'; period: Period }
  | { type: 'SET_TEAM'; teamId: string | null }
  | { type: 'SET_MODEL'; model: string | null }

const DEFAULT_PERIOD: Period = '30d'
const VALID_PERIODS: Period[] = ['7d', '30d', '90d']

/**
 * Build the initial filter state from a URL query string (e.g.
 * `?team=team-mobile&period=7d`). Deep links like
 * `/outcomes?team=team-mobile` carry the intended filters in the query, so we
 * seed the reducer from them on first render — otherwise the controlled
 * dropdowns boot to their defaults and silently ignore the request.
 *
 * `period` is validated against the known set and falls back to the default;
 * empty `team`/`model` params are treated as "no selection" (null) so they
 * match the dropdowns' "All …" option.
 */
export function initFilterState(search: string): FilterState {
  const params = new URLSearchParams(search)
  const period = params.get('period') as Period | null
  return {
    period: period && VALID_PERIODS.includes(period) ? period : DEFAULT_PERIOD,
    teamId: params.get('team') || null,
    model: params.get('model') || null,
  }
}

/**
 * Translate a URL query string into the filter actions it requests, for
 * syncing state on client-side navigation (e.g. a "View full →" link to
 * `/reliability?team=team-mobile`). Only params actually *present* in the URL
 * produce actions — a param-less navigation (e.g. a sidebar link to
 * `/overview`) leaves the existing filters untouched, so a filter the user set
 * persists across pages. An invalid `period` is ignored rather than forced to
 * the default, since that would clobber a valid current selection.
 */
export function filterActionsFromSearch(search: string): FilterAction[] {
  const params = new URLSearchParams(search)
  const actions: FilterAction[] = []
  if (params.has('period')) {
    const period = params.get('period') as Period
    if (VALID_PERIODS.includes(period)) actions.push({ type: 'SET_PERIOD', period })
  }
  if (params.has('team')) actions.push({ type: 'SET_TEAM', teamId: params.get('team') || null })
  if (params.has('model')) actions.push({ type: 'SET_MODEL', model: params.get('model') || null })
  return actions
}

function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_PERIOD':
      return { ...state, period: action.period }
    case 'SET_TEAM':
      return { ...state, teamId: action.teamId }
    case 'SET_MODEL':
      return { ...state, model: action.model }
  }
}

const FilterContext = createContext<{
  state: FilterState
  dispatch: React.Dispatch<FilterAction>
} | null>(null)

export function FilterProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer so the URL is read once, on mount, before the first render
  // (avoids a first-paint flash + double data fetch on a hard load of a deep link).
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    initFilterState(window.location.search),
  )

  // Re-sync on client-side navigation: the provider doesn't remount when a
  // <Link> changes the route, so the lazy initializer alone never sees the new
  // query string. Keyed on the search string so it only fires when the query
  // actually changes — dropdown edits don't touch the URL and thus won't loop.
  const { search } = useLocation()
  useEffect(() => {
    for (const action of filterActionsFromSearch(search)) dispatch(action)
  }, [search])

  return <FilterContext.Provider value={{ state, dispatch }}>{children}</FilterContext.Provider>
}

export function useFilterContext() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider')
  return ctx
}
