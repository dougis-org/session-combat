## Why

Related GitHub issue: `#72`.

Codacy is reporting less than 16% coverage because the repository's current
coverage artifact is also low, not because the upload pipeline is obviously
broken. The checked-in coverage summary reports 15.47% line coverage across the
configured Jest surface, while large areas of the application remain untested,
including most API routes, the combat page, storage/auth helpers, and multiple
shared UI components.

## Problem Space

The current CI workflow uploads unit and integration LCOV artifacts to Codacy,
and the live workflow still matches the archived coverage-reporting change.
That means the immediate problem is not missing uploads; it is that the current
tests exercise only a narrow subset of the production code.

The gap is also uneven. A handful of domains are well-covered, such as the
D&D Beyond import logic and offline queue classes, while core gameplay and
account-management flows are near 0% coverage. At the same time, the existing
Playwright suite already exercises meaningful client-side flows across auth,
characters, parties, encounters, monster import, and combat, but that browser-
executed code is not currently represented in Codacy coverage. Without a
documented baseline, prioritized targets, and clear rules for what counts
toward coverage, future test work will remain ad hoc and Codacy will continue
to surface a low but accurate signal.

## Scope

In scope:
- Verify that Codacy coverage is derived from the same LCOV artifacts produced
  by the current CI workflow.
- Define a durable coverage-governance capability that records the verified
  baseline, target areas, and milestone thresholds.
- Extend the CI coverage capability so coverage reporting remains accurate and
  auditable as additional suites are added, including browser coverage from
  Playwright where it is technically reliable.
- Produce an implementation plan for raising coverage with prioritized unit,
  integration, and E2E work across the highest-value untested modules.

Out of scope:
- Rewriting the entire test suite in one change.
- Introducing brittle percentage gates without a staged rollout plan.
- Counting generated, seed, or one-off script files as first-priority coverage
  targets when core runtime flows are still largely untested.

## What Changes

- Add a new `coverage-improvement-plan` capability that defines the verified
  baseline, reporting source of truth, prioritization model, and staged
  coverage milestones.
- Modify `ci-build-test` so the spec explicitly requires reproducible coverage
  reporting inputs, a documented method for comparing local/CI/Codacy totals,
  and a Chromium-only path for capturing client-side Playwright coverage without
  weakening cross-browser regression coverage.
- Create a phased implementation plan that raises coverage in the highest-value
  untested areas first, while also crediting already-exercised client-side
  surfaces from the Playwright suite such as register, login, characters,
  parties, monster import, encounters, and combat flows.
- Document risks, exclusions, and rollout constraints so future coverage work
  does not drift into vanity metrics or duplicate test effort.

## Capabilities

### New Capabilities
- `coverage-improvement-plan`: Define the verified coverage baseline, target
  modules, milestone thresholds, and reporting rules for future coverage work.

### Modified Capabilities
- `ci-build-test`: Require coverage reporting to remain traceable to the same
  LCOV-producing test jobs used in CI and Codacy comparisons.

## Impact

- `openspec/specs/coverage-improvement-plan/spec.md`
- `openspec/specs/ci-build-test/spec.md`
- `.github/workflows/build-test.yml`
- `playwright.config.ts`
- `jest.config.js`
- `jest.integration.config.js`
- `package.json`
- `tests/unit/**`
- `tests/integration/**`
- `tests/e2e/**`
- Potential browser-coverage merge utilities or instrumentation helpers for
  Playwright Chromium runs
- Coverage artifacts under `coverage/` and Codacy project reporting for
  `dougis-org/session-combat`

## Risks

- Coverage can be inflated by targeting easy files instead of risky behavior,
  so the plan must prioritize runtime-critical flows over low-value files.
- Browser-only coverage can overstate progress if it is treated as equivalent to
  server or route-handler coverage, so Playwright-reported coverage must be
  described as client-side only unless full-stack instrumentation is added.
- If coverage collection scopes are changed carelessly, Codacy percentages may
  move without any real quality improvement.
- UI-heavy areas such as `app/combat/page.tsx` can consume large effort unless
  broken into smaller, testable seams first.

## Non-Goals

- Guaranteeing a single-change jump from ~15% to a final long-term target.
- Adding coverage for seed scripts, archived artifacts, or generated content
  before core app and API behavior are covered.
- Changing product behavior unrelated to testability or coverage accuracy.

## Open Questions

- Should script-style files under `lib/scripts/` remain in the primary coverage
  denominator, or should the implementation explicitly exclude them after human
  review?
- Should phased coverage thresholds be enforced in CI immediately, or only after
  the first milestone lands and the baseline is intentionally reset?

## Change Control

This proposal requires human review and approval before design, specs, tasks,
or apply work is treated as implementation-ready. If scope changes after
approval, the proposal, design, specs, and tasks artifacts must be updated
before `/opsx:apply` or implementation proceeds. Implementation and PR notes
for this change should continue to reference GitHub issue `#72`.