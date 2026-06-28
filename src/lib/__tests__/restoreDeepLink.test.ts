import { describe, it, expect, vi } from 'vitest'
import { restoreDeepLink } from '../restoreDeepLink'

function run(search: string, hash = '') {
  const replaceState = vi.fn()
  const restored = restoreDeepLink({ search, hash }, { replaceState })
  return { replaceState, restored }
}

describe('restoreDeepLink', () => {
  it('rewrites the URL to the path encoded by 404.html in ?p=', () => {
    // 404.html turns /flightdeck/cost into /flightdeck/?p=/flightdeck/cost
    const { replaceState, restored } = run('?p=/flightdeck/cost')
    expect(restored).toBe('/flightdeck/cost')
    expect(replaceState).toHaveBeenCalledWith(null, '', '/flightdeck/cost')
  })

  it('restores the original query string from ?q=, un-escaping ~and~', () => {
    const { restored } = run('?p=/flightdeck/cost&q=from=2~and~to=5')
    expect(restored).toBe('/flightdeck/cost?from=2&to=5')
  })

  it('un-escapes ~and~ inside the path too', () => {
    const { restored } = run('?p=/flightdeck/repos/a~and~b')
    expect(restored).toBe('/flightdeck/repos/a&b')
  })

  it('preserves the hash fragment', () => {
    const { restored } = run('?p=/flightdeck/reliability', '#span-1')
    expect(restored).toBe('/flightdeck/reliability#span-1')
  })

  it('does nothing on a normal load with no ?p= (returns null)', () => {
    const { replaceState, restored } = run('')
    expect(restored).toBeNull()
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('ignores unrelated query params', () => {
    const { replaceState, restored } = run('?utm_source=email')
    expect(restored).toBeNull()
    expect(replaceState).not.toHaveBeenCalled()
  })
})
