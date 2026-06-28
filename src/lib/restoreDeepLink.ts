/**
 * GitHub Pages SPA deep-link restore.
 *
 * GitHub Pages has no server-side rewrites, so refreshing a deep route (e.g.
 * `/flightdeck/cost`) serves `public/404.html`, which redirects to
 * `/flightdeck/?p=/flightdeck/cost&q=<query>` — it encodes the originally
 * requested path in `p` and the query string in `q`, with any literal `&`
 * escaped as `~and~`.
 *
 * Without this step the app boots at the root, React Router matches `path="/"`,
 * and every refresh bounces to `/overview`. Run this BEFORE the router reads
 * `window.location` (i.e. before `createRoot().render`) to rewrite the URL back
 * to the encoded path, so a refresh stays on the page the user was on.
 *
 * Takes `Location`/`History` slices as args so it can be unit-tested without jsdom
 * navigation. Returns the restored URL, or `null` when there is nothing to restore.
 */
export function restoreDeepLink(
  location: Pick<Location, 'search' | 'hash'>,
  history: Pick<History, 'replaceState'>,
): string | null {
  const params = new URLSearchParams(location.search)
  const encodedPath = params.get('p')
  if (!encodedPath) return null

  const path = encodedPath.replace(/~and~/g, '&')
  const encodedQuery = params.get('q')
  const query = encodedQuery ? '?' + encodedQuery.replace(/~and~/g, '&') : ''
  const restored = path + query + location.hash

  history.replaceState(null, '', restored)
  return restored
}
