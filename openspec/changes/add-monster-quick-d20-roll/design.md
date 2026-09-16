## Context

- Relevant architecture: `lib/components/CombatantCard.tsx` composes one combatant row per active combat; it already reserves an empty header slot (`data-card-section="quick-rolls"`, line ~109) for exactly this kind of per-card control. The card already performs a local, unanimated die roll for death saves (`handleDeathSaveRoll`, using `rollDie` from `lib/utils/dice.ts`) — this change follows that same pattern rather than the shared/animated dice-FAB pattern.
- Dependencies: `lib/utils/dice.ts` (`rollDie`), `lib/components/icons/dice.tsx` (`DiceD20Icon`), `lib/components/dice/DiceRollOverlay.tsx` (`DiceRollOverlay`, `BuiltRoll` type from `lib/dice/useDicePoolState.ts`).
- Interfaces/contracts touched: `CombatantCardProps` is unchanged (no new required props — `combatant.type` is already available). No changes to `BuiltRoll`, `DiceRollOverlay`, `rollDie`, or any API route.

## Goals / Non-Goals

### Goals

- Add a single quick-roll button to monster combat cards that rolls one d20 and displays it through the existing static result modal.
- Reuse existing primitives with zero changes to their public contracts.
- Keep the roll fully local/ephemeral to the card — no persistence, no chat, no server call.

### Non-Goals

- Attack-bonus math, advantage/disadvantage, or per-monster-action rolls.
- Any change to the global dice FAB, dice pool, or percentile roll flows.
- Any animation work — the roll must never attempt the 3D tumble.

## Decisions

### Decision 1: Gate the button on `combatant.type === 'monster'`

- Chosen: Render the button only when `combatant.type === 'monster'`.
- Alternatives considered: Gating on the inverse (`!== 'player'`), which would also show it for `lair`.
- Rationale: `CombatantState.type` is the union `"player" | "monster" | "lair"` (`lib/types.ts:561`); `lair` rows represent lair actions, not a creature that rolls attacks, so an inverse check would be wrong per the proposal's stated edge case.
- Trade-offs: None — this is a direct, literal match to the issue's scope ("any monster in combat").

### Decision 2: Roll via `rollDie(20)[0]`, same pattern as `handleDeathSaveRoll`

- Chosen: Add a handler that calls `rollDie(20)[0]` synchronously and stores the raw value in local component state.
- Alternatives considered: Building the roll through `useDicePoolState`'s `buildRoll()`, which requires staging a pool via `handleAdd`/`handleRemove` first.
- Rationale: `useDicePoolState` is designed around the interactive pool-builder UI (add/remove dice, modifier input); a single fixed d20 roll needs none of that machinery. `rollDie` is already the card's own established "instant roll" primitive.
- Trade-offs: The `BuiltRoll` object is constructed by hand instead of via a shared builder function (see Decision 3), a small amount of duplicated shape-construction.

### Decision 3: Hand-construct a minimal `BuiltRoll` and render `DiceRollOverlay` with `disableAnimation`

- Chosen: On roll, build `{ formula: '1d20', rolls: [value], total: value, breakdown: [{ sides: 20, value }], modifier: 0 }` and render `<DiceRollOverlay built={...} disableAnimation onClose={...} />` from card-local state (`null` when no roll is active).
- Alternatives considered: Adding a `buildD20Roll()` helper to `useDicePoolState.ts` to centralize `BuiltRoll` construction.
- Rationale: `DiceRollOverlay`'s `disableAnimation` prop already exists specifically to reveal the static numeric-chip modal immediately (`modalRevealed = disableAnimation || ...`); no prop or component change is needed. Inlining the four-field object literal in `CombatantCard.tsx` is simpler than introducing a new shared export for a single call site; if a second caller needs the same construction later, it can be extracted then.
- Trade-offs: If a future change needs the same "bare Nd20" construction elsewhere, this literal will need to be lifted out at that point — acceptable per YAGNI given there is currently one call site.

### Decision 4: One `activeRoll` state slot per card, replaced (not stacked) on repeat clicks

- Chosen: A single `useState<BuiltRoll | null>` per `CombatantCard` instance holds at most one in-flight roll; clicking the button while an overlay is open replaces the state, which remounts `DiceRollOverlay` (matching `GlobalDiceFab`'s existing `key`-based remount pattern for re-gating a new roll).
- Alternatives considered: Ignoring clicks while an overlay is open (disable the button during display).
- Rationale: Because each card owns its own state, there is no cross-card interference; replacing state is simpler than adding a disabled/in-flight flag, and matches the risk mitigation already committed to in the proposal (no stacked modals).
- Trade-offs: A very fast double-click will silently discard the first roll's display in favor of the second — acceptable since the DM directly caused the second click and the goal is a fresh number, not an audit trail.

## Proposal to Design Mapping

- Proposal element: Button gated to monster-type combatants only
  - Design decision: Decision 1
  - Validation approach: Unit test rendering the card with `combatant.type` set to each of `'monster'`, `'player'`, `'lair'`, asserting button presence/absence.
- Proposal element: Bypass animation, reuse existing result modal
  - Design decision: Decisions 2 and 3
  - Validation approach: Unit test clicking the button and asserting `DiceRollOverlay` (or its rendered result content) appears immediately with `disableAnimation` behavior, without waiting on any animation-status prop.
- Proposal element: Roll is local/ephemeral, no chat/persistence
  - Design decision: Decisions 2 and 3 (no `useRollSubmission`, `diceSessionBridge`, or rolls-API involvement)
  - Validation approach: Unit test asserting no network/fetch call and no session-chat submission function is invoked when the button is clicked.
- Proposal element: No stacked modals on repeated clicks
  - Design decision: Decision 4
  - Validation approach: Unit test clicking the button twice in succession and asserting exactly one result modal is present, showing the latest roll's value.

## Functional Requirements Mapping

- Requirement: A monster combat card shows a quick-roll button reusing the `DiceD20Icon`.
  - Design element: Decision 1 (render gate) + icon reuse
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Monster card renders the quick-roll button"
  - Testability notes: Query by `data-testid` within `data-card-section="quick-rolls"`; assert icon/button presence for a `monster`-typed combatant.
- Requirement: Player and lair cards do not show the button.
  - Design element: Decision 1
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Non-monster combatant does not render the quick-roll button"
  - Testability notes: Parameterized test over `'player'` and `'lair'` types asserting absence.
- Requirement: Clicking the button rolls exactly one d20 and displays the value with no animation.
  - Design element: Decisions 2 and 3
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Quick roll shows an immediate unmodified d20 result"
  - Testability notes: Mock `rollDie` to return a fixed value; assert the rendered total matches and no animation-related props/timers gate the reveal.
- Requirement: The roll is never sent to session chat or persisted.
  - Design element: Decisions 2 and 3 (no shared-submission calls)
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Quick roll is never submitted or persisted"
  - Testability notes: Spy on `fetch`/`submitRoll`-equivalent and assert it is never called.
- Requirement: Repeated clicks show only the latest roll, never stacked modals.
  - Design element: Decision 4
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Repeated quick rolls replace rather than stack"
  - Testability notes: Two clicks in sequence; assert a single result element with the second roll's value.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The button must not interfere with other card state (HP, conditions, targeting, death saves) already managed by `CombatantCard`.
  - Design element: New state is a single independent `useState` slot, isolated from `useCombatantHp` and existing panel-toggle state.
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Quick roll does not affect other card state"
  - Testability notes: Existing `CombatantCard` test suites (HP, death-saves, conditions) must continue passing unmodified; add one test asserting a quick roll leaves HP/conditions/targeting state untouched.
- Requirement category: accessibility
  - Requirement: The button must be a native, keyboard-activatable control with an accessible name, consistent with the existing "Use a native button for legendary-action badges" convention.
  - Design element: Plain `<button>` with `aria-label`, matching the style of other action buttons already in `CombatantCard.tsx` (e.g. "Add Target(s)", "Add Condition").
  - Acceptance criteria reference: specs/monster-quick-roll/spec.md — "Scenario: Monster card renders the quick-roll button"
  - Testability notes: Assert the element has an accessible role of `button` and a non-empty accessible name.

## Risks / Trade-offs

- Risk/trade-off: Hand-inlining the `BuiltRoll` literal (Decision 3) duplicates shape knowledge that also lives in `useDicePoolState.ts`.
  - Impact: If `BuiltRoll`'s shape changes, this call site must be updated in lockstep even though it doesn't import the builder function.
  - Mitigation: `BuiltRoll` is already imported as a type from `lib/dice/useDicePoolState.ts`, so a TypeScript shape change fails the build at this call site — no silent drift possible.
- Risk/trade-off: Replacing rather than queuing rolls (Decision 4) discards a roll if double-clicked very fast.
  - Impact: DM briefly sees only the second value.
  - Mitigation: Explicitly accepted in the proposal; a fresh number is the desired outcome, not a log of every click.

## Rollback / Mitigation

- Rollback trigger: The button causes a regression in existing `CombatantCard` behavior (HP, conditions, targeting, death saves) or fails accessibility/testing gates.
- Rollback steps: Revert the `CombatantCard.tsx` edit (restore the empty `quick-rolls` slot) and delete the new test file(s); no other files are touched, so this is a single self-contained revert.
- Data migration considerations: None — no data model, storage, or API changes are made.
- Verification after rollback: Existing `CombatantCard` test suites pass unchanged, confirming no residual coupling.

## Operational Blocking Policy

- If CI checks fail: Fix the failing test/lint/type error before merging; this change has no infrastructure or deploy surface, so failures are expected to be local to the new code.
- If security checks fail: N/A expected (no new inputs, network calls, or persisted data); if a scanner flags something unexpectedly, treat it as a real finding and address it — do not waive without a cited human decision, per project policy.
- If required reviews are blocked/stale: Given the narrow, single-file scope, ping the reviewer directly; no special escalation process needed beyond normal PR review.
- Escalation path and timeout: If blocked more than one normal review cycle, raise with the requester (issue #734 author) directly since they are the sole approver context for this small change.

## Open Questions

- None — all design-level ambiguity was resolved during exploration prior to this proposal.
