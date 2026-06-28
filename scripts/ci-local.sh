#!/usr/bin/env bash
#
# Run the exact checks CI runs, locally, before code leaves the machine.
# Mirrors .github/workflows/ci.yml jobs (test, storybook-test, build) so a
# commit that would go red in CI fails here first — no wasted CI minutes.
#
# Stages run cheapest-first so the common failures surface fast:
#   1. tsc --noEmit         (the `test` job typecheck)
#   2. test:coverage        (the `test` job — fails under the 80% line threshold)
#   3. pnpm build           (the `build` job — tsc -b && vite build)
#   4. build-storybook      (the `storybook-test` + `build` jobs)
#   5. storybook test-runner (the `storybook-test` job a11y/render smoke tests)
#
# CI=true makes pnpm/storybook behave non-interactively, exactly like CI.
# Bypass in an emergency with `git commit --no-verify` or `SKIP_CI_HOOK=1`.

set -euo pipefail
export CI=true

cd "$(git rev-parse --show-toplevel)"

# storybook-static is served on this port for the test-runner, matching CI.
SB_PORT=6006
SB_DIR=storybook-static
SERVER_PID=""

cleanup() {
  # Always tear down the static server, even if a stage fails.
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }

start=$(date +%s)

step "1/5  Type check (tsc --noEmit)"
pnpm exec tsc --noEmit
ok "types clean"

step "2/5  Unit tests with coverage (80% line threshold)"
pnpm test:coverage
ok "tests + coverage pass"

step "3/5  Production build (tsc -b && vite build)"
pnpm build
ok "build succeeds"

step "4/5  Build Storybook"
pnpm build-storybook --quiet
ok "storybook builds"

step "5/5  Storybook a11y / render smoke tests"
# The test-runner drives a real Chromium against the built static Storybook,
# the same way CI does. Install the browser once if it's missing.
if ! pnpm exec playwright install chromium --dry-run >/dev/null 2>&1; then
  echo "  installing Chromium for Playwright (one-time)…"
  pnpm exec playwright install chromium
fi
python3 -m http.server "$SB_PORT" -d "$SB_DIR" >/dev/null 2>&1 &
SERVER_PID=$!
sleep 2
pnpm storybook:test --url "http://localhost:${SB_PORT}"
ok "storybook tests pass"

printf '\n\033[1;32m✅ All CI checks passed in %ss — safe to push.\033[0m\n' "$(( $(date +%s) - start ))"
