## Context

- Relevant architecture:
  - Catalog: `lib/data/conditionCatalog.ts` -> `lib/scripts/seedConditionCatalog.ts` (upsert by `name`, `$set` whole entry) -> `lib/storage/conditionCatalogRepo.ts` (explicit `{name, description}` projection) -> `GET /api/conditions/catalog` -> `ConditionFormModal` (copies `description` into a new `StatusCondition`).
  - Combat state: `lib/hooks/useCombat.ts` (`nextTurn`, `rollUnrolledMonsters`), `lib/hooks/useInitiativeModal.ts` (auto-open on unrolled), `lib/components/ActiveCombatView.tsx` (`unrolledMonsterCount`), `lib/components/combatant-card/TargetingPanel.tsx` (target lists + chips), `lib/combat/deathSaves.ts` (`lifeStateDisplay` greying), `lib/combat/conditionExpiry.ts` (`processRoundEnd` removes expired conditions).
- Dependencies: none new.
- Interfaces/contracts touched: `StatusConditionCatalogEntry` and `StatusCondition` gain an optional boolean; `/api/conditions/catalog` response gains an optional field; persisted `conditionCatalog` docs and saved combat state remain valid without it.

## Goals / Non-Goals

### Goals

- Add Banished to the catalog and make "removed from play" a real, flag-driven behavior.
- One helper is the single source of truth for the state; every call site uses it.
- Backward compatible: absent flag == current behavior.

### Non-Goals

- Name-based detection, blocking HP edits, other condition automation, redesigning `ConditionFormModal`.

## Decisions

### Decision 1: Flag lives on the catalog entry and is copied to `StatusCondition`

- Chosen: `removedFromPlay?: boolean` on both `StatusConditionCatalogEntry` and `StatusCondition`. `ConditionFormModal` copies it from the selected entry (alongside `description`).
- Alternatives considered: match on `name === "Banished"`; a separate hardcoded set of names.
- Rationale: Data-driven, so future removed-from-play conditions need only a catalog entry; avoids a hand-typed custom "Banished" silently changing turn order.
- Trade-offs: Requires touching the type, projection, and modal; custom conditions never get the flag (intended).

### Decision 2: Combatant state is derived, not stored

- Chosen: `isRemovedFromPlay(c) = c.conditions.some(x => x.removedFromPlay === true)` in new `lib/combat/removedFromPlay.ts`. "Set when the condition is added, cleared when removed" holds automatically, including removal by `processRoundEnd` expiry.
- Alternatives considered: a stored `combatant.removedFromPlay` boolean mutated in `addCondition`/`removeCondition`/`processRoundEnd` (three write sites, drift risk, and `TargetingPanel.addConditionToTarget` would need it too).
- Rationale: A single read-side predicate cannot go stale.
- Trade-offs: O(conditions) per check; negligible.

### Decision 3: `nextTurn` skip

- Chosen: Extend the existing `isDownedMonster` predicate in `nextTurn` to `isDownedMonster(c) || isRemovedFromPlay(c)`, keeping the single bounded lap. Skipped combatants do not get their legendary pool reset (the reset already happens only for the landed index).
- Alternatives considered: a second pass after landing; filtering before sort.
- Rationale: Minimal change; reuses the one-lap bound and "no combatants remain" alert.
- Trade-offs: If the current combatant is banished mid-turn, the turn is not forcibly ended; the DM presses Next as usual.

### Decision 4: Unrolled exclusion

- Chosen: Add `&& !isRemovedFromPlay(c)` to the unrolled predicates in `useInitiativeModal` (next-unrolled, list, auto-open), `rollUnrolledMonsters`, and `unrolledMonsterCount`. `initiativeRoll` presence remains the unrolled domain check (decision: unrolled only when `initiativeRoll` is absent).
- Alternatives considered: leaving unrolled detection alone.
- Rationale: A banished combatant is never going to act, so prompting for its initiative is noise; once the condition is removed the combatant is unrolled again and prompts normally.
- Trade-offs: Un-banishing mid-round can trigger the modal then.

### Decision 5: Targeting lists and stale targets

- Chosen: Filter `!isRemovedFromPlay(c)` in both `TargetingPanel` list filters. For existing `targetIds`, do not mutate state; skip rendering chips whose target is removed from play. Targets reappear if the condition is removed.
- Alternatives considered: pruning `targetIds` on banish (requires cross-combatant writes at add time, including through the freeform target path).
- Rationale: Non-destructive, no new write path.
- Trade-offs: `targetIds` can hold ids that are temporarily invisible.

### Decision 5b: Target-add path reuses `ConditionFormModal`

- Chosen: `TargetActionModal`'s "Add Condition" button calls a new `onRequestCondition()` prop; `TargetingPanel` then renders `ConditionFormModal` (heading = target name) and appends the submitted `StatusCondition` to the target via `onUpdateCombatant`. The freeform condition mode of `TargetActionModal` and `addConditionToTarget` are removed. The shared modal's catalog pick yields the flag and description; validation stays in `parseConditionForm`.
- Alternatives considered: duplicating a catalog dropdown inside `TargetActionModal`; having `addConditionToTarget` look up the catalog by name (re-introduces name matching and a second fetch).
- Rationale: One condition-entry UI and one place that builds a `StatusCondition`, so flags cannot be missed on a second path.
- Trade-offs: Behavior change for the target flow (catalog dropdown and descriptions now appear); one extra modal transition.

### Decision 6: Greying and badge

- Chosen: Card header composes `greyed = life.greyed || isRemovedFromPlay(c)` and shows a "Banished" badge when removed from play (condition name is already visible in the conditions list). `lifeStateDisplay` signature is unchanged so its other callers are unaffected.
- Alternatives considered: extending `lifeStateDisplay` to accept conditions (touches every caller/test).
- Rationale: Keeps the life-state helper pure; the new concern is separate.
- Trade-offs: Greying logic spans two helpers at one call site.

### Decision 7: Catalog entry, projection, ops

- Chosen: Add Banished with `removedFromPlay: true`; repo projection returns `removedFromPlay` only when `true` (so other entries' payloads are unchanged); seed already `$set`s the full entry; re-run seed per environment.
- Alternatives considered: schema migration.
- Rationale: Upsert-by-name needs no migration.
- Trade-offs: Un-seeded environments lack Banished until seeded.

## Proposal to Design Mapping

- Proposal element: Banished entry + flag on catalog/StatusCondition
  - Design decision: 1, 7
  - Validation approach: catalog/seed/repo/modal unit tests
- Proposal element: Flag cleared when condition removed (incl. expiry)
  - Design decision: 2
  - Validation approach: helper test + `processRoundEnd`-based test
- Proposal element: Skip in `nextTurn`
  - Design decision: 3
  - Validation approach: `useCombat` hook tests (skip, wrap, all-out)
- Proposal element: Excluded from unrolled prompts
  - Design decision: 4
  - Validation approach: `useInitiativeModal` / `ActiveCombatView` tests
- Proposal element: Target-add path applies Banished
  - Design decision: 5b
  - Validation approach: `TargetActionModal` and `TargetingPanel` component tests
- Proposal element: Hidden from targeting, stale `targetIds`
  - Design decision: 5
  - Validation approach: `TargetingPanel` component tests
- Proposal element: Greyed card
  - Design decision: 6
  - Validation approach: card header component test
- Proposal element: Re-seed after merge
  - Design decision: 7
  - Validation approach: post-merge task checklist

## Functional Requirements Mapping

- Requirement: Catalog exposes Banished with the flag
  - Design element: Decisions 1, 7
  - Acceptance criteria reference: specs "Catalog exposes a Banished condition"
  - Testability notes: Pure data + repo mock; assert API shape.
- Requirement: Flag carried onto the applied condition; custom conditions never flagged
  - Design element: Decision 1
  - Acceptance criteria reference: specs "Applied conditions carry the flag"
  - Testability notes: RTL test on `ConditionFormModal` with mocked fetch.
- Requirement: Derived removed-from-play state
  - Design element: Decision 2
  - Acceptance criteria reference: specs "Removed-from-play state is derived from conditions"
  - Testability notes: Pure function tests.
- Requirement: Turn order skips removed-from-play combatants
  - Design element: Decision 3
  - Acceptance criteria reference: specs "Initiative skips removed-from-play combatants"
  - Testability notes: Hook test with fixture combatants.
- Requirement: Unrolled prompts exclude them
  - Design element: Decision 4
  - Acceptance criteria reference: specs "Unrolled initiative handling excludes removed-from-play combatants"
  - Testability notes: Hook/component tests.
- Requirement: Targeting excludes them
  - Design element: Decision 5
  - Acceptance criteria reference: specs "Targeting excludes removed-from-play combatants"
  - Testability notes: RTL tests on `TargetingPanel`.
- Requirement: Conditions added to a target use the catalog and carry the flag
  - Design element: Decision 5b
  - Acceptance criteria reference: specs "Target-add path uses the shared condition modal"
  - Testability notes: RTL: open target modal, choose Add Condition, assert shared modal and resulting target conditions.
- Requirement: Card presentation
  - Design element: Decision 6
  - Acceptance criteria reference: specs "Removed-from-play cards are greyed"
  - Testability notes: RTL class/badge assertions.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Backward compatibility with docs/combats lacking the flag
  - Design element: Optional field, `=== true` check
  - Acceptance criteria reference: specs NFAC "Backward compatibility"
  - Testability notes: Fixtures without the field behave as before.
- Requirement category: security
  - Requirement: API returns only allowlisted catalog fields
  - Design element: Explicit projection in repo (Decision 7)
  - Acceptance criteria reference: specs NFAC "Catalog projection"
  - Testability notes: Repo test with extra stored field.
- Requirement category: performance
  - Requirement: Skip loop stays bounded to one lap
  - Design element: Decision 3
  - Acceptance criteria reference: specs NFAC "Bounded advancement"
  - Testability notes: All-removed fixture terminates with the existing alert.

## Risks / Trade-offs

- Risk/trade-off: A missed call site still treats a banished combatant as active.
  - Impact: Inconsistent UI.
  - Mitigation: Tasks enumerate each site; a grep for the unrolled/target predicates is part of validation.
- Risk/trade-off: Derived state means no persisted audit of when removal began.
  - Impact: None needed today.
  - Mitigation: Conditions list is the audit trail.

## Rollback / Mitigation

- Rollback trigger: Turn advance or targeting regressions in play.
- Rollback steps: Revert the PR; optionally delete the Banished doc from `conditionCatalog`.
- Data migration considerations: None. The optional field is ignored by older code; a saved combat containing a flagged condition simply stops being skipped.
- Verification after rollback: `nextTurn` and targeting tests pass; the dropdown no longer lists Banished if the doc was deleted.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push; repeat. Never bypass or use `--admin`.
- If security checks fail: remediate before merge; do not waive without a human-accepted risk.
- If required reviews are blocked/stale: re-request review; address all comments before auto-merge.
- Escalation path and timeout: after three review-fix iterations with no progress, or 24h blocked, report to the requester and wait for guidance.

## Open Questions

- Decision 2 (derived state, no stored combatant flag) was approved by the requester.
- None remaining; the target-add path is in scope (Decision 5b).
