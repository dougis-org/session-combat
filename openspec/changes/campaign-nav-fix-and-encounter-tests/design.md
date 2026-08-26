## Context

- Relevant architecture: Next.js App Router. `app/campaigns/page.tsx` renders the campaign list, each card with a row of `Link` action buttons. `app/campaigns/[id]/layout.tsx` already renders correct "Encounters"/"Combat" nav tabs (shipped in the archived `2026-08-24-campaign-encounters-management-screen` change, issue #537 — verified in current code, no change needed). `app/campaigns/[id]/combat/page.tsx` renders `CombatSetupView` via `useCombat({ campaignId })`; `lib/hooks/useCombat.ts` already branches its "From Library" fetch between `/api/campaigns/${campaignId}/encounters` and `/api/encounters` depending on whether `campaignId` is set (shipped in the archived `scope-campaign-encounter-picker` change, issue #538). The link/unlink/list API routes at `app/api/campaigns/[id]/encounters/route.ts` (GET/POST) and `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` (DELETE) already exist and — discovered during design — already have full unit/integration test coverage at `tests/unit/api/campaigns/[id]/encounters/route.test.ts` and `tests/unit/api/campaigns/[id]/encounters/[encounterId]/route.test.ts` (shipped in the archived `campaign-encounter-link-api` change, issue #536), covering link, unlink, list, ownership checks, and idempotent linking exactly as issue #541 requests.
- Dependencies: No new dependencies. Reuses existing `Link` (next/link), existing Tailwind utility classes, existing Playwright E2E harness (`tests/e2e/`), existing Vitest/Jest unit harness (`tests/unit/`).
- Interfaces/contracts touched: None modified. `app/campaigns/page.tsx` JSX only (presentational). No API contract changes.

## Goals / Non-Goals

### Goals

- Fix the campaign list card so it offers correctly labeled, correctly routed "Encounters" and "Start Combat" actions (closes #540's remaining scope).
- Add the E2E coverage from #541 that is not yet implemented: Start Combat routing, Encounters-tab link/unlink reflected in the combat-setup picker, and ad hoc `/combat` zero-linked-encounters Quick Entry path.
- Confirm (not re-implement) that #541's unit/integration API test requirement is already satisfied by existing tests, and document that finding so #541 can close honestly rather than by assumption.

### Non-Goals

- Implementing or testing the in-progress-campaign banner (#539 — still open, banner UI does not exist yet).
- Modifying `app/campaigns/[id]/layout.tsx`, the `/api/campaigns/[id]/encounters*` route handlers, `Campaign.encounterIds`, or `useCombat`/`CombatSetupView` scoping logic.
- Adding new API surface.

## Decisions

### Decision 1: Campaign card gets two links, not a dropdown or combined button

- Chosen: Replace the single `Link href="/encounters"` with two sibling `Link` elements, "Encounters" → `/campaigns/${campaign.id}/encounters` and "Start Combat" → `/campaigns/${campaign.id}/combat`, styled with the same button classes pattern as the four existing sibling links (Members, Prompt Builder, Library, Session Log) in that row.
- Alternatives considered: A dropdown/menu consolidating both actions; a single "Combat" button with "Encounters" moved into the nav-only surface (relying on users to click into the campaign first).
- Rationale: The proposal and original design spec (`docs/superpowers/specs/2026-08-23-campaign-encounter-linking-design.md`) both specify two explicit actions on the list card, matching the existing flat-button-row pattern already used for the other four actions on the same card. Consistency with the existing row outweighs the minor extra width of two buttons vs. one.
- Trade-offs: Slightly wider action row per card; acceptable since the row already wraps (`flex-wrap` implied by existing multi-button layout) and four other buttons already coexist there.

### Decision 2: Reuse existing color classes, avoid inventing new palette entries

- Chosen: "Start Combat" keeps the previous `bg-orange-600 hover:bg-orange-700` (was "Start Encounter"'s color, and it remains the primary/most-consequential action). "Encounters" gets an unused color in that row — `bg-teal-600 hover:bg-teal-700` — distinct from Members (default/gray-ish per existing markup), Prompt Builder (purple), Library (indigo), Session Log (green), and now Start Combat (orange).
- Alternatives considered: Introducing a new shared "campaign action button" component to reduce class duplication.
- Rationale: This change's scope is a narrow JSX fix; introducing a shared component would touch more surface than necessary (five existing inline-styled `Link`s would all need refactoring for consistency) and isn't required by either GitHub issue. Matches existing proposal Open Question resolution (default: keep orange for the primary action, pick unused color for the secondary).
- Trade-offs: Continues the existing pattern of inline Tailwind classes per link rather than a shared style constant — consistent with current file conventions, revisit only if a future change touches this file for other reasons.

### Decision 3: Do not re-implement or modify the already-tested API routes

- Chosen: Treat `/api/campaigns/[id]/encounters` (GET/POST) and `/api/campaigns/[id]/encounters/[encounterId]` (DELETE) as already meeting #541's unit/integration test requirement, based on the existing test files enumerated in Context. No new unit/integration tests are added for these routes by this change.
- Alternatives considered: Writing a fresh, redundant test suite "to be safe."
- Rationale: The existing tests already cover every scenario listed in #541's checklist (link an owned encounter, idempotent re-link, ownership rejection, player-cannot-link, DM unlinks, unlink-when-not-linked is a no-op, player-cannot-unlink, list/empty-list, non-member rejection) — verified by reading `tests/unit/api/campaigns/[id]/encounters/route.test.ts` and the sibling `[encounterId]/route.test.ts` test names directly. Duplicating this coverage would add maintenance burden with no verification value.
- Trade-offs: If the tasks/apply phase discovers a gap between what was verified here and what actually runs in CI (e.g. tests are skipped, or a scenario was missed), this decision must be revisited — call it out explicitly rather than silently closing #541 on a stale assumption (see Risks and Rollback).

### Decision 4: New E2E tests live in a new file scoped to campaign-combat linking, not appended to `tests/e2e/campaigns.spec.ts` or `tests/e2e/combat.spec.ts`

- Chosen: Add `tests/e2e/campaign-combat-linking.spec.ts` for the three new E2E scenarios (Start Combat routing, Encounters-tab link/unlink reflected in picker, ad hoc zero-linked Quick Entry).
- Alternatives considered: Appending to `campaigns.spec.ts` (currently scoped to chapter drag-and-drop only) or `combat.spec.ts` (currently scoped to ad hoc/global combat mechanics, already large per the grep results — 20+ tests).
- Rationale: `campaigns.spec.ts`'s existing `describe` block is topically unrelated (drag-and-drop chapter ordering); `combat.spec.ts` is already large and topically about in-combat mechanics rather than setup/routing. A new file scoped to "campaign ↔ encounter ↔ combat linking" mirrors how the feature itself was designed (a distinct linking layer) and keeps the new tests discoverable and independently runnable.
- Trade-offs: One more E2E spec file; acceptable given existing precedent of many topic-scoped spec files in `tests/e2e/`.

## Proposal to Design Mapping

- Proposal element: `app/campaigns/page.tsx` two-link fix (#540)
  - Design decision: Decision 1, Decision 2
  - Validation approach: Existing/new unit test for the campaigns list page (render assertions: two links present with correct `href`s and labels, old "Start Encounter" link/href absent) + manual verification during apply.
- Proposal element: E2E — Start Combat reaches campaign combat setup
  - Design decision: Decision 4
  - Validation approach: New Playwright test in `campaign-combat-linking.spec.ts`: from `/campaigns`, click "Start Combat" on a campaign card, assert URL is `/campaigns/{id}/combat` and `CombatSetupView` (or a stable selector within it) is visible.
- Proposal element: E2E — Encounters tab link/unlink reflected in combat-setup picker
  - Design decision: Decision 4
  - Validation approach: New Playwright test: navigate to `/campaigns/{id}/encounters`, link an existing encounter, navigate to `/campaigns/{id}/combat`, assert it appears in "From Library"; return and unlink, re-check combat setup picker no longer lists it, and confirm it's still present on `/encounters`.
- Proposal element: E2E — ad hoc `/combat` Quick Entry with zero linked encounters
  - Design decision: Decision 4
  - Validation approach: New Playwright test: navigate to `/combat` directly (no campaignId), use Quick Entry to add combatants, start combat, assert combat screen renders — asserting this path is unaffected by the campaign-scoping change.
- Proposal element: Unit/integration API test coverage for `/api/campaigns/[id]/encounters*` (#541)
  - Design decision: Decision 3
  - Validation approach: No new tests; verification is re-running the existing suites (`npm run test:unit`, `npm run test:integration`) during apply/tasks validation to confirm they still pass and still exist at the paths cited in Context.
- Proposal element: Banner E2E scenario excluded (blocked on #539)
  - Design decision: (Non-Goals)
  - Validation approach: N/A — explicitly out of scope; no test written.

## Functional Requirements Mapping

- Requirement: Campaign list card shows "Encounters" and "Start Combat" instead of "Start Encounter", both linking correctly.
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` (to be authored in the specs artifact) — scenario "Campaign card shows Encounters and Start Combat links".
  - Testability notes: Deterministic via unit test on rendered `href`/text content; no async/timing concerns.
- Requirement: "Start Combat" reaches campaign-scoped combat setup, not the add-encounter screen.
  - Design element: Decision 4, E2E scenario 1
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` — scenario "Start Combat routes to campaign combat setup".
  - Testability notes: E2E, deterministic navigation assertion; low flake risk (no async data dependency beyond page load).
- Requirement: Encounters tab link/unlink is reflected in the combat-setup "From Library" picker.
  - Design element: Decision 4, E2E scenario 2
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` — scenario "Linking and unlinking an encounter updates the combat-setup picker".
  - Testability notes: Async — depends on API round-trip + picker refetch. Assert on final UI state (list membership) rather than intermediate loading states or fixed sleeps, per existing repo E2E conventions.
- Requirement: Ad hoc `/combat` still starts combat successfully with zero campaign encounters linked.
  - Design element: Decision 4, E2E scenario 3
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` — scenario "Ad hoc combat Quick Entry is unaffected by campaign scoping".
  - Testability notes: Deterministic; this path pre-exists and this test is a regression guard, not new behavior.
- Requirement: `/api/campaigns/[id]/encounters*` link/unlink/list/ownership/idempotency behavior is covered by automated tests.
  - Design element: Decision 3
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` — scenario "Existing API test coverage satisfies #541's requirement" (a verification-only scenario, not new behavior).
  - Testability notes: Verified by re-running existing suites; no new test code. Testability risk is documentation drift (tests could be renamed/removed later) — mitigated by citing exact file paths in this design and re-verifying at apply time.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: New E2E tests must not introduce flakiness into the existing suite.
  - Design element: Decision 4 — assert on final UI state, not fixed waits.
  - Acceptance criteria reference: `specs/campaign-nav-encounter-fix/spec.md` — non-functional note on E2E stability.
  - Testability notes: Run the new spec file repeatedly (e.g. `--repeat-each=3` locally) during apply to catch obvious flakiness before merge.
- Requirement category: operability
  - Requirement: This change must not alter production API behavior or response shapes.
  - Design element: Decision 3 (no route changes).
  - Acceptance criteria reference: N/A — negative requirement, verified by diff review (no changes under `app/api/`).
  - Testability notes: Enforced by code review / diff inspection at PR time; not independently testable beyond "the diff doesn't touch app/api/campaigns/[id]/encounters*".

## Risks / Trade-offs

- Risk/trade-off: Decision 3 assumes existing tests fully satisfy #541 without re-running them as part of this design phase.
  - Impact: If the tasks/apply phase finds those tests are stale, disabled, or actually failing, #541 cannot honestly be closed by this change without additional work.
  - Mitigation: Tasks phase includes an explicit step to run `npm run test:unit` / `npm run test:integration` and confirm the cited test files pass before claiming #541's API-test requirement is met; if they fail or are missing, treat as a Change Control scope change per the proposal.
- Risk/trade-off: New E2E test file adds to overall E2E suite runtime.
  - Impact: Marginal CI time increase (3 new tests).
  - Mitigation: Accept — proportionate to the coverage gained; no existing perf budget is documented as being at risk.
- Risk/trade-off: Styling choice (teal for "Encounters") is a judgment call absent explicit user confirmation (see proposal Open Questions).
  - Impact: Low — cosmetic only, easily adjusted in review.
  - Mitigation: Flagged in proposal as non-blocking; apply-time implementer can adjust based on PR review feedback without needing a new proposal cycle.

## Rollback / Mitigation

- Rollback trigger: The two-link campaign card change causes a UI regression (e.g. broken layout, broken links) caught in review or post-merge; or a new E2E test proves flaky/unreliable in CI after merge.
- Rollback steps: Revert the single commit/PR (`git revert`) — this change touches one presentational file and adds test files only, with no data migration or API surface change, so a straight revert is safe and complete.
- Data migration considerations: None — no data model or storage changes.
- Verification after rollback: Confirm `app/campaigns/page.tsx` shows the pre-change single "Start Encounter" link again (or re-triage: whether to fix-forward instead of reverting the JSX fix specifically, keeping any independently-valid new tests) and that `npm run test:unit` / `npm run test:e2e` pass on the reverted state.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the change branch before merge; do not merge with red CI. If a failure is in a pre-existing, unrelated suite (as happened in the archived `campaign-encounter-link-api` change, which noted a pre-existing unrelated typecheck error), document it explicitly in the PR rather than silently ignoring, and confirm it is not caused by this change's diff.
- If security checks fail: Treat as blocking; this change has no expected security-relevant surface (no auth, no data access changes), so any security finding is unexpected and must be triaged before merge, not suppressed.
- If required reviews are blocked/stale: Follow existing repo PR review process (`pr-review-toolkit:review-pr` per prior archived changes' task lists); address all findings before merge. Escalate to the requester if review stalls for reasons unrelated to the findings themselves.
- Escalation path and timeout: If CI or review remains blocked after reasonable iteration (prior archived changes used a "3+ iterations with no progress" threshold), stop, report the stall with remaining findings/failures listed, and wait for human guidance rather than bypassing gates.

## Open Questions

- None beyond those already carried from `proposal.md` (button color choice, E2E file naming) — both resolved with defaults in this design (Decision 2, Decision 4) and flagged as non-blocking, adjustable during apply/review.
