## Context

- **Relevant architecture:** Node.js 20.9+, npm 10.x, Next.js 16.2.x app router, TypeScript 5.x, Jest/Playwright testing stack
- **Dependencies:** next, eslint-config-next (both pinned in lock file; patch update only)
- **Interfaces/contracts touched:** None (internal dependency, no API surface changes expected in patch release)

## Goals / Non-Goals

### Goals

- Patch Next.js 16.2.2 → 16.2.6 to eliminate 13 security vulnerabilities
- Maintain 100% test passage (unit, integration, E2E)
- Keep application code unchanged (dependency bump only)
- Validate build succeeds and produces runnable artifact

### Non-Goals

- Fix transitive PostCSS vulnerability (requires separate upgrade)
- Update React/react-dom versions
- Refactor or optimize code
- Change Next.js configuration

## Decisions

### Decision 1: Patch Release Only

- **Chosen:** Upgrade from 16.2.2 to 16.2.6 (patch-level, ^16.2.x constraint maintained)
- **Alternatives considered:** 
  - Skip upgrade (deferred security debt)
  - Upgrade to 16.3.0+ (breaking changes, higher risk)
  - Upgrade to 17.0.0 (major version, significant risk)
- **Rationale:** Patch releases guarantee backward compatibility. No code changes required. Previous 16.1.6 → 16.2.2 upgrade proved this team's ability to execute successfully.
- **Trade-offs:** PostCSS XSS vulnerability remains (requires separate initiative). Minor version jump deferred until scheduled Next.js roadmap alignment.

### Decision 2: Synchronized Version Bumping

- **Chosen:** Update both `next` and `eslint-config-next` to 16.2.6
- **Alternatives considered:** Update only `next`, leave eslint-config-next at 16.2.2
- **Rationale:** ESLint configuration must match Next.js version to avoid rule incompatibility. Keeping them synchronized reduces configuration debt.
- **Trade-offs:** Minimal—both are Vercel-maintained and released together.

### Decision 3: Validation via Existing Test Suite

- **Chosen:** Rely on 116 unit + 23 integration + 11 E2E tests to validate correctness
- **Alternatives considered:** Add new tests specific to Next.js 16.2.6 features; add smoke tests
- **Rationale:** Patch releases have zero public API changes. Existing tests exercise all application behavior. Adding redundant tests adds work with no new coverage gain. Recent decompose-combat-page refactor passed all tests, proving suite is active.
- **Trade-offs:** If a subtle runtime incompatibility exists, existing tests may not catch it (unlikely given patch-release guarantee).

## Proposal to Design Mapping

- **Proposal element:** "13 security vulnerabilities in 16.2.2"
  - **Design decision:** Decision 1 (patch to 16.2.6)
  - **Validation approach:** `npm audit` output verification post-upgrade

- **Proposal element:** "Patch-level upgrade carries minimal risk"
  - **Design decision:** Decisions 1 & 3 (patch-only, existing test suite)
  - **Validation approach:** All tests pass, build succeeds

- **Proposal element:** "No application code changes needed"
  - **Design decision:** Decision 2 (dependency-only update)
  - **Validation approach:** Code review of package.json/lock changes only

## Functional Requirements Mapping

- **Requirement:** Security vulnerabilities patched
  - **Design element:** Decision 1 (16.2.6 upgrade)
  - **Acceptance criteria reference:** `npm audit` shows zero Next.js vulnerabilities
  - **Testability notes:** Run `npm audit --production` post-upgrade; verify no high/moderate severities

- **Requirement:** Application behavior unchanged
  - **Design element:** Decision 3 (test suite validation)
  - **Acceptance criteria reference:** All 150 tests pass; E2E tests validate key user flows
  - **Testability notes:** Run `npm test`, `npm run test:integration`, `npx playwright test`

## Non-Functional Requirements Mapping

- **Requirement category:** Reliability
  - **Requirement:** Build succeeds without errors
  - **Design element:** Decision 1 (patch upgrade)
  - **Acceptance criteria reference:** `npm run build` exits 0
  - **Testability notes:** CI workflow runs build; verify no errors in logs

- **Requirement category:** Security
  - **Requirement:** Vulnerabilities eliminated
  - **Design element:** Decision 1 (16.2.6)
  - **Acceptance criteria reference:** `npm audit --production` shows clean audit after upgrade
  - **Testability notes:** Compare `npm audit` output before/after

- **Requirement category:** Maintainability
  - **Requirement:** Configuration consistency (Next.js ↔ ESLint)
  - **Design element:** Decision 2 (synchronized versions)
  - **Acceptance criteria reference:** `next --version` and `eslint-config-next` version in package.json match
  - **Testability notes:** Manual inspection of package.json; no automated test needed

## Risks / Trade-offs

- **Risk:** Patch release contains unexpected breaking change
  - **Impact:** Tests fail or application crashes in production
  - **Mitigation:** Patch releases are zero-impact by semantic versioning. This is extremely unlikely. Test suite provides defense in depth.

- **Risk:** Transitive dependency conflict (e.g., @next/env version mismatch)
  - **Impact:** Subtle runtime errors or build failures
  - **Mitigation:** npm handles transitive deps automatically. Lock file prevents skew. Previous upgrade succeeded without issues.

- **Risk:** ESLint rule incompatibility between eslint-config-next versions
  - **Impact:** Linting fails unexpectedly
  - **Mitigation:** Vercel maintains ESLint config in lockstep with Next.js. Unlikely to break. Synchronized versions prevent skew.

- **Trade-off:** PostCSS vulnerability remains unpatched
  - **Impact:** One moderate-severity XSS vulnerability persists
  - **Mitigation:** Tracked separately; require separate PostCSS upgrade or Next.js major version. Acceptable risk; does not block this security patch.

## Rollback / Mitigation

- **Rollback trigger:** Any of: tests fail, build fails, E2E tests fail, `npm audit` shows new vulnerabilities, application crashes in staging
- **Rollback steps:**
  1. Revert `package.json` and `package-lock.json` to commit before upgrade
  2. Run `npm ci` to restore 16.2.2
  3. Run full test suite to validate rollback
  4. If issue is critical, keep branch closed and escalate; if recoverable, document issue and retry
- **Data migration considerations:** None (dependency-only change, zero schema/data impact)
- **Verification after rollback:** All tests pass, build succeeds, application serves requests without errors

## Operational Blocking Policy

- **If CI checks fail:**
  - Investigate root cause (Next.js incompatibility, test flake, environment issue)
  - If incompatibility detected, escalate and consider rollback
  - If test flake (unrelated to upgrade), fix and rerun
  - SLA: resolve within 2 hours

- **If security checks fail (Codacy, npm audit):**
  - If new vulnerability introduced by upgrade: escalate immediately, consider rollback
  - If pre-existing vulnerability: document as known issue, proceed if not blocking
  - SLA: resolve before merge

- **If required reviews are blocked/stale:**
  - Ping reviewers with link to artifacts and 24-hour turnaround request
  - If no response after 24 hours, escalate to project lead
  - Patch releases should not be gate-keepered by review delays due to security urgency

- **Escalation path and timeout:**
  - 1st: Assignee investigates (immediate)
  - 2nd: Ping @dougis in PR comment (if no response in 2 hours)
  - 3rd: Direct message (if no response in 6 hours)
  - Final: Close PR and create issue for async follow-up if blocker cannot be resolved same-day

## Open Questions

- None. Design is fully specified and low-risk.
