import { useFilterContext } from '../context/FilterContext'
import type { Period } from '../types'

export function useFilters() {
  const { state, dispatch } = useFilterContext()
  return {
    ...state,
    setPeriod: (period: Period) => dispatch({ type: 'SET_PERIOD', period }),
    setTeamId: (teamId: string | null) => dispatch({ type: 'SET_TEAM', teamId }),
    setModel: (model: string | null) => dispatch({ type: 'SET_MODEL', model }),
  }
}
