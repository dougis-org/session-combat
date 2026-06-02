## Context

- Relevant architecture: E2E test helpers in `tests/e2e/helpers/actions.ts` — shared utility functions used by `tests/e2e/combat.spec.ts` and `tests/e2e/parties.spec.ts`. No application code is touched.
- Dependencies: Playwright (`getByLabel`, `page.request.post`). `seedCharacter` already exists and calls `POST /api/characters`.
- Interfaces/contracts touched:
  - `createParty()` public signature in `tests/e2e/helpers/actions.ts`
  - All callers in `combat.spec.ts` and `parties.spec.ts`

## Goals / Non-Goals

### Goals

- Replace positional checkbox selection with label-based selection in `createParty()`.
- Ensure every caller that needs members seeds those characters explicitly via `seedCharacter`.
- Add member add/remove regression tests isolated per test via fresh user registration.

### Non-Goals

- No changes to application code.
- No changes to `seedCharacter` helper.
- No shared character fixtures across tests.

## Decisions

### Decision 1: `memberNames: string[]` replaces `memberCount: number`

- Chosen: Accept `memberNames: string[]`; select each by `page.getByLabel(name).check()`.
- Alternatives considered: Keep `memberCount` alongside `memberNames` as optional fields; use a separate `addMember(page, name)` helper.
- Rationale: Callers must be explicit about which characters they need — the silent empty-party fallback is the core bug. A single unified parameter removes ambiguity entirely.
- Trade-offs: Callers must now know names upfront, but they always seed the characters themselves so the names are already in scope.

### Decision 2: Inline `seedCharacter` per test (no shared `beforeEach` across tests)

- Chosen: Each test seeds its own characters inline or in a describe-scoped `beforeEach` that runs per test.
- Alternatives considered: A file-level `beforeAll` that seeds a shared character pool.
- Rationale: Playwright runs tests in parallel workers. A `beforeAll` shared pool would require a shared user account, which breaks isolation. Fresh user registration per test is the existing pattern — characters are user-scoped and isolated by design.
- Trade-offs: Slightly more setup code per test; acceptable cost for guaranteed isolation.

### Decision 3: `seedCharacter` (API) for new seeds; `createCharacter` (UI) only where UI flow is tested

- Chosen: Use `seedCharacter(page, { name })` for all new character prerequisites. Preserve `createCharacter` in the end-to-end test where the character creation UI flow is part of what's being verified.
- Alternatives considered: Replace all `createCharacter` calls with `seedCharacter`.
- Rationale: The end-to-end test at `combat.spec.ts:493` explicitly tests the character creation flow — replacing it with a seed would weaken that test.
- Trade-offs: Two helpers exist for creating characters; usage is determined by what's under test.

### Decision 4: Combat party tests get real member seeding (extended scope)

- Chosen: The three combat party tests (`"user can create a party"`, `"party with different member counts"`, `"complete end-to-end flow"`) will seed real characters and assert member counts.
- Alternatives considered: Migrate them to `memberNames: []` (empty party, minimal change).
- Rationale: These tests claimed to test party creation with N members but silently created empty parties. Seeding real characters makes them test what they say they test.
- Trade-offs: More setup per test; worth it for test correctness.

## Proposal to Design Mapping

- Proposal element: Replace `memberCount` with `memberNames[]`
  - Design decision: Decision 1
  - Validation approach: TypeScript compilation catches all call-site mismatches; Playwright throws on `getByLabel(name)` if name not found.

- Proposal element: Each test owns its own data, thread-safe
  - Design decision: Decision 2
  - Validation approach: Tests pass under `--workers=4` parallel execution.

- Proposal element: `seedCharacter` for new prerequisites
  - Design decision: Decision 3
  - Validation approach: No UI navigation to `/characters/create` in the new seeds; API response `200 OK` asserted inside `seedCharacter`.

- Proposal element: Extended scope — seed real members in combat party tests
  - Design decision: Decision 4
  - Validation approach: Assert `Members: N` text visible after party creation.

## Functional Requirements Mapping

- Requirement: `createParty` selects members by name, not position
  - Design element: `getByLabel(name).check()` loop in `createParty`
  - Acceptance criteria reference: specs/createparty-helper/spec.md
  - Testability notes: Playwright strict-mode throws if label not found; passing wrong name fails loudly.

- Requirement: Combat party tests select real named members
  - Design element: Inline `seedCharacter` calls before `createParty` in each combat test
  - Acceptance criteria reference: specs/combat-party-tests/spec.md
  - Testability notes: Assert `Members: N` on the party card after creation.

- Requirement: New member add/remove regression tests
  - Design element: `"Party member management"` describe block in `parties.spec.ts` with describe-scoped `beforeEach`
  - Acceptance criteria reference: specs/party-member-management-tests/spec.md
  - Testability notes: Assert member count change and name presence/absence on party card.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must be idempotent and not depend on pre-existing DB state
  - Design element: `registerUser` per test creates a fresh user; characters are user-scoped
  - Acceptance criteria reference: All specs — each has isolated setup
  - Testability notes: Tests pass on a clean DB and on a DB with existing data from prior runs.

- Requirement category: operability
  - Requirement: Parallel test execution must not cause cross-test interference
  - Design element: Decision 2 — per-test user isolation
  - Acceptance criteria reference: All specs
  - Testability notes: Run `npx playwright test --workers=4`; all tests green.

## Risks / Trade-offs

- Risk/trade-off: `getByLabel(name)` strict mode — if the character name appears as a label elsewhere on the page, Playwright throws.
  - Impact: Test failure on the setup step.
  - Mitigation: The existing `parties.spec.ts:77–81` pattern confirms this works in `PartyEditor`. If a regression occurs, scope the locator to the member list container.

- Risk/trade-off: Identity-prefixed names are long; `getByLabel` matches substring by default.
  - Impact: Could match a different checkbox if two character names share a prefix.
  - Mitigation: `identity.name(base)` produces unique, run-scoped names (e.g. `"[T1-abc] Aragorn"`). Collisions are practically impossible.

## Rollback / Mitigation

- Rollback trigger: Any E2E test failure after the change lands on main.
- Rollback steps: Revert the PR. No DB migration, no data changes — test-only change.
- Data migration considerations: None.
- Verification after rollback: Re-run `npx playwright test tests/e2e/` — all tests green.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test before re-requesting review.
- If security checks fail: N/A — no application code changed.
- If required reviews are blocked/stale: Re-request after 24 hours; escalate to repo maintainer after 48 hours.
- Escalation path and timeout: Tag `@dougis` in the PR after 48 hours of no review activity.

## Open Questions

No open questions. All design decisions were resolved during the explore and proposal sessions.
