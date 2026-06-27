# Implementation Plan
## Flightdeck — Org-Level AI Coding Agent Analytics Portal

---

## Phase 1: Project Scaffold

1. `pnpm create vite@latest flightdeck -- --template react-ts`
2. Install dependencies:
   - UI: `tailwindcss`, `@tailwindcss/forms`, `shadcn/ui`, `@fontsource/inter`, `lucide-react`
   - Charts: `recharts`
   - Routing: `react-router-dom`
   - Testing: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
   - Storybook: `storybook@10.4.6`, `@storybook/react-vite`, `@storybook/addon-essentials`, `@storybook/addon-a11y`
3. Configure Tailwind (dark mode `class`, extend colors for autonomy bands)
4. Initialize shadcn/ui (`pnpm dlx shadcn@latest init`)
5. Configure `vite.config.ts` with `base: '/flightdeck/'`
6. Configure Vitest + jsdom setup file
7. Initialize Storybook (`.storybook/main.ts` + `preview.ts` with Tailwind import + dark bg decorator)
8. Set up ESLint + Prettier
9. Configure `BrowserRouter` with `basename="/flightdeck"` in `src/main.tsx`
10. Add `.github/workflows/ci.yml` and `deploy.yml` skeletons (fill in Phase 7)

---

## Phase 2: Types & Mock Data Layer

11. Write `src/types/index.ts` — all interfaces (AgentTask, TraceSpan, PullRequestOutcome, SecurityEvent, Team, Repo, User, all response types)
12. Write `src/mock/seed.ts` — mulberry32 PRNG, exported as `createRng(seed: number)`
13. Write `src/mock/generators/generateTeams.ts` + unit test
14. Write `src/mock/generators/generateRepos.ts` + unit test
15. Write `src/mock/generators/generateUsers.ts` + unit test
16. Write `src/mock/generators/generateTasks.ts` (90-day corpus, weekday/weekend distribution) + unit test
17. Write `src/mock/generators/generateSpans.ts` (TraceSpan per task) + unit test
18. Write `src/mock/generators/generatePROutcomes.ts` (edit distance, autonomy band) + unit test
19. Write `src/mock/generators/generateSecurityEvents.ts` (injected spike at day 60) + unit test
20. Write `src/mock/api.ts` — all mock API functions with 100–200ms simulated delay + unit test

---

## Phase 3: Utility Functions

21. Write `src/lib/utils.ts`:
    - `formatCurrency`, `formatDuration`, `formatNumber`, `formatPercent`
    - `computeTrend(current, prior) → number | null`
    - `classifyAutonomy(task, pr) → AutonomyBand`
22. Write `src/lib/__tests__/utils.test.ts` covering all functions and edge cases

---

## Phase 4: Auth & Layout Shell

23. Write `src/auth/RequireAuth.tsx` — reads `sessionStorage`, redirects to `/login` if absent
24. Write `src/context/FilterContext.tsx` — period, teamId, model state + dispatch
25. Write `src/hooks/useFilters.ts` — consumes FilterContext
26. Write `src/hooks/useMockData.ts` — generic `{ data, loading, error }` wrapper for mock API calls
27. Write `src/components/layout/Sidebar.tsx` — nav links, active state, icon-only collapse < 1280px
28. Write `src/components/layout/TopBar.tsx` — org name, period picker, team filter, model filter
29. Write `src/components/layout/AppShell.tsx` — composes Sidebar + TopBar + `<Outlet />`
30. Wire routing in `src/App.tsx`:
    - `/login` → LoginPage (public)
    - All other routes inside RequireAuth + AppShell nested layout

---

## Phase 5: Shared Components & Stories

31. Write `src/components/charts/SparklineChart.tsx` + story (with data, flat/empty)
32. Write `src/components/cards/KpiCard.tsx` + unit test + story (5 variants)
33. Write `src/components/cards/AlertBadge.tsx` + story (4 severity variants)
34. Write `src/components/charts/BudgetGauge.tsx` + unit test + story (50%, 90%, 110%)
35. Write `src/components/charts/LineChart.tsx` (reusable Recharts wrapper) + story
36. Write `src/components/charts/AreaChart.tsx` + story
37. Write `src/components/charts/StackedAreaChart.tsx` + story
38. Write `src/components/charts/BarChart.tsx` (horizontal + vertical) + story
39. Write `src/components/charts/ScatterChart.tsx` (TeamScatter) + story
40. Write `src/components/charts/AutonomyBar.tsx` + story (all bands, single band)
41. Write `src/components/tables/TeamTable.tsx` + unit test + story (populated, empty, sorted)
42. Write `src/components/tables/WorkflowTable.tsx` + story
43. Write `src/components/tables/ToolTable.tsx` + story (populated, all-errors)
44. Write `src/components/tables/TaskList.tsx` + unit test + story (mixed, all-failed, empty)
45. Write `src/components/tables/EventLog.tsx` + unit test + story (populated, filtered, empty)
46. Write `src/components/overlays/SpanDrawer.tsx` + unit test + story (with spans, with error span, loading)

---

## Phase 6: Pages

47. Write `src/pages/LoginPage.tsx` + test (render, click button, sessionStorage set, redirect)
48. Write `src/pages/OverviewPage.tsx` + integration test
49. Write `src/pages/OutcomesPage.tsx` + integration test
50. Write `src/pages/CostPage.tsx` + integration test
51. Write `src/pages/ReliabilityPage.tsx` + integration test
52. Write `src/pages/GovernancePage.tsx` + integration test
53. Write `src/pages/TeamDetailPage.tsx` + integration test
54. Write `src/pages/RepoDetailPage.tsx` + integration test

---

## Phase 7: CI/CD & Deployment Config

55. Complete `.github/workflows/ci.yml`:
    - `test` job: `pnpm install --frozen-lockfile` → `tsc --noEmit` → `vitest run --coverage`
    - `storybook-test` job: build Storybook → `storybook test` (a11y + interaction tests)
    - `build` job (needs test + storybook-test): `vite build` → `storybook build -o dist/storybook` → upload artifact
56. Complete `.github/workflows/deploy.yml`:
    - Trigger: push to `main` after `ci.yml` passes
    - Download artifact → `actions/deploy-pages`
57. Set GitHub repository Pages source to GitHub Actions

---

## Phase 8: Polish & QA

58. Add loading skeleton components for all page sections
59. Add empty state components for all zero-data scenarios
60. Verify responsive layout at 768px, 1024px, 1440px
61. Run `vitest run --coverage` — verify ≥ 80% lines
62. Run `storybook test` — verify zero critical/serious a11y violations
63. Build locally and verify `dist/` serves correctly at `/flightdeck/` base path
64. Final visual pass: consistent spacing, typography, color, hover states
65. Verify all AC items from testing-spec pass manually on the built output
