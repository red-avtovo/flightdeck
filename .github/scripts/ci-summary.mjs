// Writes a human-readable test + coverage report to the GitHub Actions job summary,
// and emits Shields "endpoint" badge JSON (deployed to Pages) for the README.
// Inputs (best-effort): test-results.json (vitest json reporter),
// coverage/coverage-summary.json (vitest json-summary reporter).
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs'

const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

const tests = readJson('test-results.json')
const cov = readJson('coverage/coverage-summary.json')?.total

const pct = (m) => (m ? Number(m.pct.toFixed(1)) : null)
const lines = pct(cov?.lines)
const statements = pct(cov?.statements)
const functions = pct(cov?.functions)
const branches = pct(cov?.branches)

const total = tests?.numTotalTests ?? 0
const passed = tests?.numPassedTests ?? 0
const failed = tests?.numFailedTests ?? 0
const suites = tests?.numTotalTestSuites ?? 0
const allGreen = failed === 0 && total > 0

// ── Job summary ──────────────────────────────────────────────────────────────
const md = `## ${allGreen ? '✅' : '❌'} Test results

| Suites | Tests | Passed | Failed |
| --- | --- | --- | --- |
| ${suites} | ${total} | ${passed} | ${failed} |

## Coverage

| Lines | Statements | Functions | Branches |
| --- | --- | --- | --- |
| ${lines ?? '—'}% | ${statements ?? '—'}% | ${functions ?? '—'}% | ${branches ?? '—'}% |
`
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md)
console.log(md)

// ── Shields endpoint badges (served from GitHub Pages) ───────────────────────
const covColor = (v) =>
  v == null ? 'lightgrey'
  : v >= 90 ? 'brightgreen'
  : v >= 80 ? 'green'
  : v >= 70 ? 'yellowgreen'
  : v >= 60 ? 'yellow'
  : v >= 50 ? 'orange'
  : 'red'

mkdirSync('badges', { recursive: true })
writeFileSync('badges/tests.json', JSON.stringify({
  schemaVersion: 1,
  label: 'tests',
  message: failed ? `${passed} passed, ${failed} failed` : `${passed} passed`,
  color: allGreen ? 'brightgreen' : 'red',
}))
writeFileSync('badges/coverage.json', JSON.stringify({
  schemaVersion: 1,
  label: 'coverage',
  message: lines == null ? 'unknown' : `${lines}%`,
  color: covColor(lines),
}))
