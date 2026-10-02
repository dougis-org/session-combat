## Context

- Relevant architecture: Next.js API routes (`app/api/**`) call a per-domain repo layer (`lib/storage/*Repo.ts`). `lib/storage.ts` is a facade that forwards 1:1 to those repos (`getUserPreferences`/`updateUserPreferences` are re-exported directly). Jest tests use `jest.mock()` factories.
- Dependencies: `lib/storage/shareRepo.ts`, `lib/storage/campaignTemplateRepo.ts`, `lib/storage/userPreferencesRepo.ts`; precedent change #687 (PR #810).
- Interfaces/contracts touched: Import structure of 7 route handlers; mock targets of 6 unit tests. No HTTP, type, or DB contract changes.

## Goals / Non-Goals

### Goals

- Remove `import { storage }` from the 7 handlers; use narrow repo imports.
- Retarget the 6 unit tests' mocks to the narrow repos.
- Keep the full unit suite, typecheck and build green.

### Non-Goals

- Editing repo internals or `lib/storage.ts`; removing facade methods.
- Migrating other domains or facade-level tests.

## Decisions

### Decision 1: Namespace imports of narrow repos

- Chosen: `import * as shareRepo from '@/lib/storage/shareRepo'`, `import * as campaignTemplateRepo from '@/lib/storage/campaignTemplateRepo'`, `import * as userPreferencesRepo from '@/lib/storage/userPreferencesRepo'`.
- Alternatives considered: Named imports (`import { addShare } …`), as `characters/[cid]/route.ts` does for `getMember`.
- Rationale: Matches #687 and `partyRepo`/`campaignRepo` usage in the same files; call sites change by one identifier; `jest.mock` factories need no restructuring.
- Trade-offs: None material.

### Decision 2: Mock narrow repos in unit tests

- Chosen: Replace `jest.mock('@/lib/storage', …)` with `jest.mock('@/lib/storage/<repo>', () => ({ fn: jest.fn() }))` and reference the mocked module directly (e.g. `jest.mocked(shareRepo)`), dropping the `jest.mocked(storage).x` alias objects.
- Alternatives considered: `jest.spyOn`; keeping the facade mock.
- Rationale: Facade mock would no longer intercept anything once routes stop importing it; `jest.mock` hoisting is the codebase norm.
- Trade-offs: Each test must list every repo function its route uses; an omitted function surfaces as a `not a function` failure (desired fail-fast).

### Decision 3: Leave the facade and facade-level tests alone

- Chosen: No edits to `lib/storage.ts`, `facadeShape.test.ts`, `storage-shares.test.ts`, `storage/campaigns.test.ts`, `campaigns.character-sharing.integration.test.ts`, `mePreferences.test.ts`.
- Alternatives considered: Retarget facade tests to repos now.
- Rationale: Those tests validate the facade/repo behavior itself and the facade shape guardrail (#503); out of scope per issue ("callers").
- Trade-offs: Facade retains live test callers until a later epic step.

## Proposal to Design Mapping

- Proposal element: Migrate 3 share routes
  - Design decision: Decision 1
  - Validation approach: Typecheck; the 3 share route tests
- Proposal element: Migrate 3 campaign-template routes
  - Design decision: Decision 1
  - Validation approach: Typecheck; `global.*.test.ts`
- Proposal element: Migrate preferences route
  - Design decision: Decision 1
  - Validation approach: Typecheck; `tests/integration/api/mePreferences.test.ts` (unchanged, must still pass)
- Proposal element: Retarget 6 unit tests
  - Design decision: Decision 2
  - Validation approach: `npm run test:unit`
- Proposal element: Out of scope (facade intact)
  - Design decision: Decision 3
  - Validation approach: `facadeShape.test.ts` passes unchanged

Unit tests to retarget (all under `tests/unit/api/campaigns/`): `[id]/characters/[cid]/route.test.ts`, `[id]/characters/route.test.ts`, `[id]/members/[userId]/route.unit.test.ts`, `global.route.test.ts`, `global.id.route.test.ts`, `global.id.copy.route.test.ts`. The preferences route has no unit test importing the facade.

## Functional Requirements Mapping

- Requirement: Share, template and preferences routes call narrow repos
  - Design element: Decisions 1–2
  - Acceptance criteria reference: `specs/storage-callers-narrow-imports-minor-domains/spec.md` — "Route handlers directly call narrow repos"
  - Testability notes: Route unit tests assert on repo mocks; grep confirms no `@/lib/storage'` facade import in the 7 files.
- Requirement: Behavior unchanged
  - Design element: Decision 2 (existing assertions kept as-is)
  - Acceptance criteria reference: Same scenario ("response remains identical")
  - Testability notes: Existing assertions unchanged; only mock wiring changes.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Tests intercept the correct repo and never reach the DB
  - Design element: Decision 2
  - Acceptance criteria reference: NFAC "Test Suite Isolation"
  - Testability notes: Unit run has no DB; a wrong mock path fails loudly.
- Requirement category: reliability
  - Requirement: Facade public shape unchanged
  - Design element: Decision 3
  - Acceptance criteria reference: NFAC "Facade shape preserved"
  - Testability notes: `facadeShape.test.ts` passes unmodified.

## Risks / Trade-offs

- Risk/trade-off: Mock path mismatch
  - Impact: Failing tests or accidental real-module use
  - Mitigation: Run each test right after editing; explicit factories
- Risk/trade-off: Missed caller
  - Impact: Acceptance criterion partly unmet
  - Mitigation: Final grep of `app lib` for the 10 facade method names

## Rollback / Mitigation

- Rollback trigger: Any regression in unit, integration, or build.
- Rollback steps: Revert the PR; the change is import-only with no state.
- Data migration considerations: None.
- Verification after rollback: `npm run test:unit` and build green on `main`.

## Operational Blocking Policy

- If CI checks fail: Diagnose, fix on the branch, re-run local validation, push; do not merge red. Never use `--admin`.
- If security checks fail: Remediate before merge; no waivers without an explicit human-accepted risk.
- If required reviews are blocked/stale: Re-request review and ping the owner; auto-merge stays queued.
- Escalation path and timeout: After 3 unproductive fix iterations or 24h blocked, report to the user with the remaining findings.

## Open Questions

- None.
