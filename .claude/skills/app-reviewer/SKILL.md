---
name: app-reviewer
description: >-
  Use when working through the Flightdeck analytics dashboard and the user points
  at something on a page that displays the wrong thing or reads poorly and wants
  it fixed — even a small-looking tweak. Typical complaints: a metric shown as a
  percentage that should be a raw count (or vice versa), a duration printed as raw
  minutes instead of human-readable time, a chart axis/label/tooltip showing
  nonsensical or unformatted values, a table cell or status that should be a
  colored badge, a KPI card missing its inline sparkline, or a control whose form
  should change (dropdown → button toggle group). Treat these as "this part of the
  live UI renders or behaves wrong, correct it" even when the user never says
  "review." These fixes look trivial but each must ship four coupled artifacts to
  keep the repo coherent — commented UI code, synced specs (requirements +
  technical), tests, and a Storybook story, all green — which is why the skill
  applies even to one-line changes. Do NOT use for dependency bumps, CI/Storybook
  job failures, app-wide features like theme toggles, mock-data generation, broad
  PR or code review, or performance/bundle profiling.
---

# Flightdeck App Reviewer

You are reviewing a React + TypeScript analytics dashboard and fixing UI/UX
defects the user spots. The hard-won lesson behind this skill: a UI fix is not
done when the pixels look right. It's done when the **code explains itself**, the
**specs still describe reality**, a **test pins the new behavior**, and a
**story lets a human eyeball it** — with the whole project still building. Skip
any one of those and the dashboard rots: the next change breaks something silent,
or the spec lies, or a regression slips through. The four artifacts are the point.

## The loop

The user reviews the app one tab/page at a time and calls out specific problems.
For **each** problem they raise:

1. **Locate** — find the component, page, and data source behind the complaint.
   The data layer (`src/mock/api.ts`) is as likely to be the culprit as the
   component. A chart "showing percents" or "breaking on filter" is usually a
   formatter or a generator, not the chart itself.
2. **Diagnose the root cause** — not the symptom. "1200%" wasn't a styling issue;
   it was absolute counts run through a percent formatter. "Team comparison breaks
   on filter" was points collapsing to the origin when the filtered set was empty.
   State the cause in one sentence before you touch code.
3. **Fix it, and comment the UI** — make the change, and leave a short comment
   explaining the *behavior or the why*, matching the comment density and idiom of
   the surrounding code. Comments earn their place by explaining intent a reader
   can't get from the code itself (e.g. "ignore team filter so the comparison
   stays cross-team"), not by restating it.
4. **Sync the specs** — see [Definition of done](#definition-of-done).
5. **Add or adjust tests.**
6. **Add or adjust Storybook stories.**
7. **Verify green** before moving to the next item or committing.

Then move to the next critique. Don't batch — finish one item's four artifacts
before starting the next, so a failure is always traceable to one change.

## Definition of done

Every adjustment, however small, ships all four:

| Artifact | Where | Why it matters |
|----------|-------|----------------|
| **Commented UI** | the component/page/api you changed | The next reader (often you) needs the *why*, not a diff archaeology session. |
| **Specs in sync** | `docs/requirements-spec.md` is the **source of truth**; keep `docs/technical-spec.md` in lockstep | The specs are read as ground truth. A fix that changes behavior without updating them makes the docs actively misleading. |
| **Tests** | `src/**/__tests__/*.test.{ts,tsx}` (Vitest + React Testing Library + userEvent) | Pins the new behavior so it can't silently regress. Test the behavior the user cared about, not the implementation. |
| **Storybook story** | `*.stories.tsx` next to the component | NFR-02: every component has a story. Stories are how a human (and the a11y addon) inspects states. New visual states need new story variants. |

### Verify (all must pass, every time)

```bash
pnpm tsc -b              # typecheck — no errors
pnpm vitest run          # all unit tests green
pnpm build-storybook     # stories compile; a11y addon catches violations
```

Run these before committing. If you changed a formatter, a generator, or a shared
component, run them even if the change "looks trivial" — shared changes ripple.

## Repo-specific knowledge that saves you time

- **Pages** live in `src/pages/*Page.tsx` (Overview, Outcomes, Cost, Reliability,
  Governance, plus team/repo drill-downs). Each reads filters via `useFilters()`
  and data via `useMockData(() => getXxx(period, teamId, model), [deps])`.
- **Filters** are global: `FilterContext` holds `{ period, teamId, model }`. When
  you make a filter functional, thread it through the matching `getXxx` in
  `src/mock/api.ts` *and* the per-task helpers (`tasksFor`, `priorTasksFor`).
- **Mock data is deterministic** (`src/mock/data.ts`, mulberry32 PRNG seed=42).
  Generators share one `_rng` drawn in a fixed order. **Changing how many random
  numbers you draw shifts the entire dataset** (still deterministic, but snapshot
  tests and "expected" numbers move). When you must override a value, *draw then
  override* to preserve draw order. To protect existing snapshot/equality tests,
  gate new filter/alert behavior on a `filtersActive` flag so the **default
  (unfiltered) output stays byte-identical**.
- **Charts** are in `src/components/charts/`. Shared `ChartTooltip` gives the
  legend-style tooltip (swatch + series name + formatted value) and hides trend
  overlays (`__trend_*` keys). Reuse it rather than re-styling Recharts tooltips.
  Numeric axes take `allowDecimals`; count charts want integer formatters.
- **KpiCard** contract: `higherIsBetter` decides good/bad coloring
  (`isGood = trendPositive === higherIsBetter`). Pass `sparkline` for the inline
  trend. Formats: `number | percent | currency | duration`.
- **`formatDuration`** (`src/lib/utils.ts`) rolls up to human units
  (`Xm Ys` → `Xh Ym` → `Xd Yh`). Prefer it over raw minutes for any time value.
- **Conventions**: Tailwind v3 slate dark theme; lucide-react icons; conventional
  commits (`feat:`/`fix:`); branch off `main`; never commit `.claude/`.

## Worked examples (the kind of fix and its four artifacts)

**"Tasks over time shows 1200% — should be absolute values."**
Root cause: stacked-area Y-axis + tooltip ran integer counts through a percent
formatter. Fix: add `valueFormat: 'number' | 'percent'` to `StackedAreaChart`,
default `'number'`, integer tick/tooltip formatter, `allowDecimals={false}`.
Comment why the prop exists. Spec: note absolute counts in FR-02. Test: a
formatter assertion. Story: a percent-mode variant alongside the count variant.

**"Team comparison breaks when I select a team."**
Root cause: filtering the scatter to one team left zero cross-team points, so they
collapsed to the origin. Fix: decouple the comparison scatter from the team filter
and instead **highlight** the selected team (`highlightTeamId`). Comment the
intent. Spec: FR note that comparison stays cross-team. Test: highlight rendering.
Story: a `Highlighted` variant.

**"1622m 48s isn't informative."**
Root cause: raw minutes shown. Fix: route through `formatDuration` rollup. Test:
boundary cases (under 60m, under 24h, over). Story: covered by KpiCard duration
variant.

The pattern is always the same: name the root cause, fix with an explanatory
comment, then specs + test + story + green. Match what the surrounding code
already does — same naming, same comment style, same test and story shape as the
neighbors.
