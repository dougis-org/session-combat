## Context

Related GitHub issue: `#72`.

The repository already has a `Build & Test` workflow that runs unit tests,
integration tests, and Playwright regression tests, then uploads available
LCOV artifacts to Codacy. The current checked-in `coverage/coverage-summary.json`
reports 15.47% line coverage, which aligns with the low Codacy percentage the
user reported. Existing tests are concentrated in import flows and offline
support classes, while large runtime-critical surfaces remain effectively
untested: most authenticated API routes, `app/combat/page.tsx`, encounter and
monster flows, auth/storage helpers, and multiple shared React components.

The current Playwright suite already drives meaningful browser flows through
`/register`, `/login`, `/characters`, `/parties`, `/monsters/import`,
`/encounters`, and `/combat`, which means client-side code in pages such as
`app/register/page.tsx`, `app/login/page.tsx`, `app/characters/page.tsx`,
`app/parties/page.tsx`, `app/encounters/page.tsx`, `app/monsters/import/page.tsx`,
and `app/combat/page.tsx` is being executed without contributing to Codacy.
However, Playwright's built-in browser coverage support is Chromium-only, while
the current CI regression run is WebKit-only, so browser coverage cannot simply
be turned on inside the existing regression job.

This change is cross-cutting because it affects specs, CI expectations, Jest
coverage behavior, and the future sequencing of unit, integration, and E2E
work. The design therefore needs to establish a single source of truth for
coverage accuracy before implementation adds more tests or changes collection
rules while satisfying the acceptance criteria tracked in issue `#72`.

Proposal-to-design mapping:
- Verified baseline and source of truth -> Decision 1 and Decision 2.
- Durable planning capability and milestones -> Decision 3.
- Prioritized high-value coverage growth -> Decision 4.
- Avoid vanity metrics or denominator drift -> Decision 5.
- Do not ignore already-covered browser flows -> Decision 6.

## Goals / Non-Goals

**Goals:**
- Preserve a reproducible way to compare local coverage artifacts, CI outputs,
  and Codacy totals.
- Define a capability that records the verified baseline and the next coverage
  milestones in implementation-ready terms.
- Prioritize test additions by business risk and code centrality, not by easiest
  files to cover.
- Ensure each planned milestone has a validation path using existing test
  commands and coverage artifacts.

**Non-Goals:**
- Solving all coverage gaps in one implementation pass.
- Adding arbitrary global coverage gates before the first milestone is complete.
- Reclassifying generated or script-style files without explicit review and a
  documented denominator change.

## Decisions

### Decision 1: Treat current LCOV plus JSON summary artifacts as the accuracy source of truth
The implementation will treat the coverage produced by the existing Jest jobs as
the authoritative baseline for Codacy comparisons. Coverage accuracy will be
verified by comparing local `coverage/coverage-summary.json` and `coverage/lcov.info`
outputs against the same jobs used in CI.

Rationale:
- The live workflow already uploads LCOV artifacts from the same test jobs.
- The current 15.47% local summary is close enough to the reported Codacy value
  to conclude the report is presently accurate.

Alternatives considered:
- Treat Codacy as the sole source of truth. Rejected because it makes debugging
  coverage drift slower and hides which job or collector changed the totals.
- Create a new custom coverage aggregator first. Rejected because it adds moving
  parts before the current pipeline has been fully documented.

Testability notes:
- Validation uses the existing unit and integration coverage jobs and compares
  the resulting summary/LCOV artifacts to the published Codacy totals.

### Decision 2: Explicitly document which test suites contribute coverage and which do not
The plan will distinguish between suites that currently emit LCOV and suites
that only validate behavior. In particular, Playwright regression tests will be
treated as non-coverage contributors until instrumentation exists, and the audit
will note that absence rather than implying those tests improve Codacy totals.

Rationale:
- Prevents false assumptions that every passing test suite increases coverage.
- Keeps the coverage plan tied to real instrumentation rather than job count.

Alternatives considered:
- Require immediate E2E instrumentation. Rejected because it adds complexity
  before the larger unit/integration gaps are addressed.

Testability notes:
- Validation checks whether coverage-producing jobs emit `coverage/lcov.info`
  and whether non-producing jobs log their lack of LCOV without failing.

### Decision 6: Add a separate Chromium-only Playwright coverage collector instead of changing the existing WebKit regression run
If Playwright-contributed coverage is added, it will run in a separate
Chromium-only coverage job that gathers browser JavaScript coverage, converts it
to Istanbul or LCOV-compatible output, and merges it with the existing coverage
pipeline. The current WebKit regression job will remain the cross-browser
stability check.

Rationale:
- Playwright coverage APIs are supported on Chromium-based browsers, not WebKit.
- The existing WebKit regression run is useful for browser-behavior validation
  and should not be repurposed as the only coverage collector.
- A separate job allows the repository to count already-exercised client-side
  flows without pretending that browser coverage includes route-handler or other
  server-side execution.

Alternatives considered:
- Replace the existing WebKit regression run with Chromium. Rejected because it
  drops current browser-diversity coverage to gain metrics.
- Ignore Playwright-covered client code entirely. Rejected because the suite
  already executes meaningful UI paths that should inform coverage reporting.

Testability notes:
- Validation checks that the Chromium coverage job emits a mergeable coverage
  artifact, that the mapped files correspond to source under `app/**` or client-
  side `lib/**`, and that WebKit regression continues to run separately.

### Decision 3: Introduce a dedicated planning capability for baseline, milestones, and exclusions
The change will add a `coverage-improvement-plan` capability that records the
baseline percentage, first-wave target areas, milestone thresholds, and review
rules for exclusions or denominator changes.

Rationale:
- Coverage work is otherwise spread across issues and CI config with no durable
  contract for what is being improved or how success is measured.

Alternatives considered:
- Keep the plan only in issue comments or proposal text. Rejected because it
  would not survive implementation and archive cleanly.

Testability notes:
- Each milestone in the plan must map to concrete tests or coverage artifact
  checks that can be run locally and in CI.

### Decision 4: Sequence implementation by risk-weighted coverage waves
Coverage improvements will be delivered in waves:
1. Authenticated API routes and shared server helpers.
2. Combat, encounters, monsters, and storage/auth client helpers.
3. Shared React components and selected E2E instrumentation follow-up.

Rationale:
- These areas represent the largest functional risk and the highest amount of
  currently untested user-facing behavior.
- The first wave can raise coverage materially without starting in the most UI-
  dense files.

Alternatives considered:
- Start with the biggest single file, `app/combat/page.tsx`. Rejected because
  that file is too large to be a safe first milestone without seam extraction.
- Target easy utility files first. Rejected because it would improve the number
  more than the quality signal.

Testability notes:
- Each wave must specify the exact suites and module groups being covered so the
  resulting delta can be attributed to a known set of tests.

### Decision 5: Do not change the coverage denominator without explicit review
Any change to `collectCoverageFrom`, excluded files, or uploaded report inputs
must be documented as a deliberate denominator change with before/after impact.

Rationale:
- A percentage increase caused by excluding files is not equivalent to better
  test coverage.

Alternatives considered:
- Immediately exclude script and seed files from coverage. Rejected until a
  human approves the scope boundary and the expected metric impact.

Testability notes:
- Validation compares the old and new `collectCoverageFrom` scopes and records
  whether a coverage delta came from more executed lines or a smaller tracked
  surface.

## Risks / Trade-offs

- Large UI files remain expensive to cover -> Mitigation: start with server/API
  and helper seams, then refactor UI hotspots before broad component tests.
- Browser coverage mapping can be noisy with framework-generated bundles ->
  Mitigation: only count source-mapped files that resolve cleanly to project
  files and validate the first merged report before making it normative.
- Coverage may still appear flat after early high-value tests if untouched files
  dominate the denominator -> Mitigation: track milestone deltas by module group,
  not only repo-wide percentage.
- CI and Codacy can diverge if upload inputs or Jest config change silently ->
  Mitigation: require explicit artifact comparison and documented contributor
  suites in the modified `ci-build-test` capability.

## Rollback / Mitigation

- If new coverage collection settings create suspicious percentage jumps, revert
  the collector or upload-input changes first and keep the new tests.
- If a milestone introduces flaky tests, disable the failing new tests only long
  enough to repair determinism, then re-run the same coverage comparison.
- If CI, review, or security checks remain blocked, stop further scope expansion,
  fix the blocking issue, and revalidate the last known-good coverage baseline
  before proceeding to the next wave.

## Implementation Note: Playwright V8 Coverage Limitation

During implementation, a critical discovery was made regarding Playwright's V8
coverage API on server-rendered Next.js applications:

**Finding:** Playwright's `page.coverage.startJSCoverage()` captures inline
scripts and page-level code executed in the browser, but on a server-rendered
Next.js app with dynamic `_next/static/chunks/*.js` bundles, the coverage data
contains page URLs (`http://localhost:3000/register`) rather than actual bundle
URLs. This prevents the current merge script from mapping V8 coverage back to
source files through source maps, because the coverage doesn't include the
actual client-side bundle execution.

**Status:** Infrastructure is in place (fixture, merge script, CI job) and
coverage collection is functional. However, **this specific implementation of
Playwright V8 coverage is not suitable for Codacy reporting in our architecture**.

**Recommended Path Forward:**
1. **Defer Playwright browser coverage** as a standalone contribution to Codacy
   until Decision 6 is revisited.
2. **Focus Wave 1-3 on unit and integration tests** instead, which have
   straightforward Istanbul/LCOV mapping.
3. **Consider alternatives for browser coverage** in a future milestone, such as:
   - Server-side code instrumentation with `nyc` or similar on the Next.js
     runtime itself
   - Custom Chrome DevTools Protocol instrumentation outside Playwright's
     coverage API
   - Accepting that Playwright exercises client UI but is documented as a
     non-coverage contributor for now

**Impact on Tasks:** Tasks 2.4 and 4.4 remain implemented as non-blocking
audit paths but should not block Wave 1 completion. Deployment of the new
`playground-coverage` CI job can proceed as a proof-of-concept without merging
the coverage totals to Codacy until the architectural limitation is resolved.

## Open Questions

- Should first-wave milestones be expressed as absolute repository percentages,
  or as module-group completion goals plus a minimum repo-wide delta?
- Should `lib/scripts/**` and similar operational files remain in the default
  denominator after the first implementation wave, or be reviewed separately?
- Should the Chromium-only Playwright coverage job run on every PR as an audit
  (non-blocking) step, or be gated on resolving the V8→source mapping limitation
  documented above?