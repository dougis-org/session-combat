## Context

- Relevant architecture: `ActiveCombatView.tsx` is a presentational component driven entirely by `useCombat()` (via `UseCombatReturn`, passed in as the `combat` prop). It also owns local UI-only state (`initiativeEditId`/`Position`, `dismissedInitiativeIds` ref) that isn't part of `useCombat`. `tests/e2e/combat.spec.ts` is a single Playwright file with one `test.describe("Combat flows", ...)` block, a file-scoped `beforeEach` (`clearCookies`), a file-scoped `registerTestUser` helper + `STRONG_PASSWORD` constant, and 28 tests across distinct feature areas, all importing from `tests/e2e/helpers/{actions,isolation}.ts` and `tests/helpers/dndBeyondImport.ts`.
- Dependencies: `lib/hooks/useCombat.ts` (state/mutators consumed by `ActiveCombatView`), `lib/utils/combat.ts` (`sortCombatants`), `lib/preferences/usePreferences.ts` (auto-scroll preference), `tests/e2e/helpers/actions.ts`, `tests/e2e/helpers/isolation.ts`, `tests/e2e/fixtures.ts`.
- Interfaces/contracts touched: none externally — `ActiveCombatViewProps` (`{ combat, user }`) stays the same. Internally, initiative-modal state/handlers move from being inline in `ActiveCombatView` to a new hook's return value, consumed the same way by the JSX that renders the modal.

## Goals / Non-Goals

### Goals

- `ActiveCombatView.tsx` and every resulting e2e spec file pass Verity's file-length/comprehensibility gate.
- Zero behavior change: same DOM structure, same `data-testid`s, same effect timing/races avoided, same test assertions.
- Preserve all inline rationale comments (effect-dependency exclusions, viewport-clamp reasoning, removal-race recovery) by moving them with the code they document.

### Non-Goals

- Redesigning the initiative-modal UX or its anchoring algorithm.
- Restructuring `tests/e2e/helpers/` beyond promoting the two small file-scoped test helpers (`registerTestUser`, `STRONG_PASSWORD`) that need to be shared across the new spec files.
- Touching `CombatSetupAndActiveModals.tsx`, `CombatantCard.tsx`, or other already-decomposed components.

## Decisions

### Decision 1: Extract initiative-modal logic into `useInitiativeModal` hook

- Chosen: create `lib/hooks/useInitiativeModal.ts` exporting a hook that takes the subset of `UseCombatReturn` it needs (`combatState`, `setInitiativeRoll`) and returns `{ initiativeEditId, initiativeEditPosition, initiativeModalRef, openInitiativeModal, handleSetInitiative, closeInitiativeModal, getCardAnchorPosition }`. `ActiveCombatView` calls this hook and uses its return values exactly where the inline state/handlers are used today (lines 127–249 today).
- Alternatives considered: (a) leave as-is and only split the test file — rejected, doesn't address the component-side gate finding named in #761; (b) extract as a subcomponent (`InitiativeModalController`) that renders the modal itself — rejected because the modal's JSX (lines 408–430) is tightly coupled to `combatState.combatants` lookup already done in the parent, and a hook keeps that lookup in one place without prop-drilling the whole combatant list into a wrapper component.
- Rationale: mirrors the precedent set by `combatant-card-decomposition` (#702) — hook extraction for self-contained stateful UI logic, subcomponents for self-contained render logic. The initiative-modal block is >80% state/effects and <20% render, making a hook the better fit.
- Trade-offs: `ActiveCombatView` still owns the JSX that renders the modal (using the hook's returned position/ref), so the split isn't 100% clean — acceptable since the JSX itself is ~20 lines and not the source of the size-gate flag.

### Decision 2: Leave CON-save handler and remove/detail popup wiring in place

- Chosen: do not extract `handleConSaveRequired` (~15 lines) or the remove/detail popup state wiring into separate modules.
- Alternatives considered: extracting both per the issue's "possibly" hedge.
- Rationale: after extracting Decision 1, `ActiveCombatView.tsx` drops from 511 to roughly ~390 lines (empirically re-measure once implemented — see Validation). If that alone clears the gate threshold, further extraction of small, already-simple wiring would only relocate lines without reducing real complexity, contradicting the proposal's non-goal of a "specific ideal architecture." Only pursue if the initiative-modal extraction alone doesn't clear the gate.
- Trade-offs: if the gate isn't satisfied by Decision 1 alone, this decision gets revisited in tasks.md as a fallback step (extract remove/detail popup state into a small `useCombatantPopups` hook).

### Decision 3: Split `combat.spec.ts` by existing `test.describe`-adjacent feature groupings, promote shared test-scoped helpers

- Chosen: split into `combat-import.spec.ts` (D&D Beyond import, character/party/encounter creation — lines ~36–252), `combat-core.spec.ts` (combat screen UI + temp HP — lines ~261–396), `combat-legendary.spec.ts` (legendary actions + full e2e flow — lines ~397–677), `combat-lair.spec.ts` (lair actions — lines ~678–834). Promote `registerTestUser` (confirmed unique to `combat.spec.ts` — no collision) into `tests/e2e/helpers/actions.ts` so all four files import the same implementation. `STRONG_PASSWORD` is **not** promoted under that name: `helpers/actions.ts` already exports a different `STRONG_PASSWORD` (`"TestPassword123!"`, a static string) that several other spec files rely on, while `combat.spec.ts`'s local constant is a randomized-per-run string (`` `TestPw${crypto.randomUUID()...}!1` ``) that `registerTestUser` depends on. Move `combat.spec.ts`'s version into `helpers/actions.ts` under a distinct name (e.g. `RANDOM_STRONG_PASSWORD`, generated fresh per call rather than as a module-level constant) alongside the promoted `registerTestUser`, which will use it internally — the four split files never need to reference the password directly.
- Alternatives considered: (a) one file per individual test.describe block only (there's only one top-level describe today, so this doesn't reduce anything by itself — the tests aren't sub-grouped by describe, just sequentially by feature) — this decision effectively introduces the sub-grouping the issue asks for; (b) duplicate `registerTestUser`/password-generation per file instead of promoting — rejected as unnecessary duplication once >1 file needs it; (c) promote `STRONG_PASSWORD` under its existing name and let it shadow/replace the static one — rejected, would silently change behavior for every other spec file importing the current static `STRONG_PASSWORD`, violating the no-behavior-change constraint.
- Rationale: matches the exact split named in issue #761's proposal section, keeps each file scoped to one feature area, reuses existing helpers per the issue's explicit instruction, avoids the naming collision confirmed by grep against `tests/e2e/helpers/actions.ts` and other spec files.
- Trade-offs: introduces two new/changed exports from `tests/e2e/helpers/actions.ts` (small, low-risk — additive; the existing `STRONG_PASSWORD` export is untouched).

## Proposal to Design Mapping

- Proposal element: Extract initiative-modal logic into a hook
  - Design decision: Decision 1
  - Validation approach: `npm run test:unit` (if any unit tests cover `ActiveCombatView`) + existing e2e initiative/turn-order coverage in `combat-core.spec.ts` and `combat-legendary.spec.ts` (turn-advance tests), run unchanged.
- Proposal element: Evaluate extracting CON-save handler / popup wiring
  - Design decision: Decision 2
  - Validation approach: measure `ActiveCombatView.tsx` line count post-Decision-1 against Verity's gate threshold before deciding whether to act on this.
- Proposal element: Split `combat.spec.ts` by feature area, reuse helpers
  - Design decision: Decision 3
  - Validation approach: full `npx playwright test tests/e2e/combat-*.spec.ts` run, diffing pass count against the original file's pass count (same number of tests, same names, all green).

## Functional Requirements Mapping

- Requirement: Initiative modal continues to auto-open for unrolled combatants, respect manual dismissal, recover if the open combatant is removed, and stay viewport-clamped, identically to current behavior.
  - Design element: `useInitiativeModal` hook (Decision 1) — all three effects and their documented dependency-array rationale move verbatim.
  - Acceptance criteria reference: issue #761 "No behavior change intended."
  - Testability notes: covered by existing e2e turn-order/legendary tests that exercise initiative entry; no new tests needed, just confirm none regress.
- Requirement: All 28 existing e2e tests in `combat.spec.ts` continue to pass, unchanged in assertions, after the split.
  - Design element: mechanical file split (Decision 3) with promoted shared helpers.
  - Acceptance criteria reference: issue #761 "All existing unit and e2e coverage still passes, unchanged in behavior."
  - Testability notes: run full suite before split (baseline) and after (comparison); test names and counts must match 1:1 across the new files.

## Non-Functional Requirements Mapping

- Requirement category: operability (Verity comprehensibility gate)
  - Requirement: neither `ActiveCombatView.tsx` nor any resulting spec file trips Verity's file-length/comprehensibility gate.
  - Design element: Decision 1 (and Decision 2 as fallback) for the component; Decision 3 for the test file.
  - Acceptance criteria reference: issue #761 acceptance criteria, bullet 1.
  - Testability notes: Verity's pre-commit/pre-push gate runs automatically; treat a FAIL as a signal to split further per Decision 2's fallback.

## Risks / Trade-offs

- Risk/trade-off: initiative-modal hook extraction could reorder hook-call sequencing if not extracted carefully (React hooks must run in the same order every render).
  - Impact: "Rendered more/fewer hooks than during the previous render" error, or subtle state desync.
  - Mitigation: extract the block as a single custom hook called unconditionally at the top of `ActiveCombatView`, matching its current unconditional call site; no change to call order relative to other hooks (`useMemo` for `characterMap`, `usePreferences`, etc.).
- Risk/trade-off: promoting `STRONG_PASSWORD` to shared helpers under its existing name would collide with `tests/e2e/helpers/actions.ts`'s current static `STRONG_PASSWORD`, which several other spec files (`parties.spec.ts`, `characters.spec.ts`, `auth.spec.ts`, etc.) already depend on.
  - Impact: confirmed via grep (not hypothetical) — silently overwriting that export would change password values used by unrelated, already-passing spec files.
  - Mitigation: addressed in Decision 3 — promote `combat.spec.ts`'s randomized password generator under a distinct name (`RANDOM_STRONG_PASSWORD` or inlined into the promoted `registerTestUser`), leaving the existing `STRONG_PASSWORD` export untouched. `registerTestUser` itself is confirmed unique (no other spec file defines it) and safe to promote as-is.

## Rollback / Mitigation

- Rollback trigger: post-split e2e run shows failures, or Verity gate still fails after Decision 1+2, or the diff review surfaces an unintended behavior change.
- Rollback steps: this is a single-PR structural change; revert the PR (or the specific commit) to restore `ActiveCombatView.tsx` and `combat.spec.ts` to their pre-split state. No data migration or deployed-state involved (pure code/test reorg).
- Data migration considerations: none — no runtime data, schema, or API changes.
- Verification after rollback: confirm `npm run test:unit` and `npx playwright test tests/e2e/combat.spec.ts` pass on the restored pre-split files.

## Operational Blocking Policy

- If CI checks fail: diagnose against the baseline (pre-split) run; if a specific test fails only post-split, treat it as a split defect (missing setup/import) and fix before merging, not as a pre-existing flake.
- If security checks fail: not expected to trigger (no new dependencies, no data/auth surface touched); if they do, treat as unrelated and investigate independently before proceeding.
- If required reviews are blocked/stale: this is a low-risk, no-behavior-change structural PR — follow standard `pr-review-toolkit:review-pr` gate per tasks.md; do not merge until it reports zero findings.
- Escalation path and timeout: per tasks.md's standard iteration policy — after 3+ review-fix-push iterations with no progress, stop and report to the user with remaining findings.

## Open Questions

- None blocking. All prior open items (in-flight change conflicts) were resolved during the explore-mode session that preceded this proposal.
