import { createContext, useContext, useReducer } from 'react'
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

const initialState: FilterState = { period: '30d', teamId: null, model: null }

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
  const [state, dispatch] = useReducer(reducer, initialState)
  return <FilterContext.Provider value={{ state, dispatch }}>{children}</FilterContext.Provider>
}

export function useFilterContext() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider')
  return ctx
}
