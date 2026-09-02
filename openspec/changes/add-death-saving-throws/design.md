## Context

- Relevant architecture:
  - `CombatantState` (`lib/types.ts:544`) is the per-combatant runtime record. Optional fields are added freely (`concentratingOn`, `pendingConSaveDC`, `legendaryActionsRemaining`); persisted `CombatState` blobs treat absent fields as defaults.
  - `lib/components/CombatantCard.tsx` owns the HP adjustment UI. `adjustHp` (`:252`) is the single place damage and healing are applied; it already special-cases `resultHp === 0`.
  - `updateCombatant(id, updates)` (`lib/hooks/useCombat.ts:378`) shallow-merges a `Partial<CombatantState>` and calls `saveCombatState`.
  - Dice: `rollDie(sides, count)` (`lib/utils/dice.ts:36`) is the centralized, rejection-sampled, crypto-secure primitive. `buildInitiativeRoll` (`lib/utils/combat.ts:262`) already uses `rollDie(20)` for combat d20s and surfaces the raw roll inline in the card (`d20:X`, `CombatantCard.tsx:554`).
  - `sortCombatants` (`lib/utils/combat.ts:290`) and `ActiveCombatView` render the initiative list; cards style by `combatant.type` (`CombatantCard.tsx:406`).
  - Conditions are decremented/expired every round by `processRoundEnd` / `tickConditions` — unsuitable for death-save state.
- Dependencies:
  - `lib/utils/dice.ts` (`rollDie`), `lib/hooks/useCombat.ts` (`updateCombatant`), `lib/components/CombatantCard.tsx`, `lib/components/ActiveCombatView.tsx`, `lib/types.ts`.
  - New: `lib/combat/deathSaves.ts` (pure helpers).
- Interfaces/contracts touched:
  - `CombatantState` gains two optional fields (`deathSaves`, `lifeState`).
  - `adjustHp` behavior for player combatants at/through 0 HP.
  - Card render output (new tracker sub-component) and initiative-list styling.

## Goals / Non-Goals

### Goals

- Automatic death-save tracker for player combatants at 0 HP, with 3 individually toggleable success slots and 3 failure slots.
- A "Roll death save" action that rolls a real d20 via `rollDie(20)`, shows the result, and applies its outcome (success / failure / nat 20 / nat 1) to the tracker.
- Correct resolution: 3 successes → `stable`; 3 failures → `dead`; running counts cleared on resolution.
- Damage while downed adds failure(s); critical hits and damage ≥ maxHp are instant death.
- Healing a downed PC above 0 HP clears all death-save state → active.
- Initiative list distinguishes active / dying / stable / dead; stable and dead are greyed out.
- All state transitions live in one tested pure module.

### Non-Goals

- House-rule / optional-rule configuration framework (follow-up issue, referenced from #92).
- Per-combatant "monster also makes death saves" opt-in.
- Auto-skipping stable/dead combatants in `nextTurn`.
- Undo for death-save edits.
- An "Unconscious" `StatusCondition`.
- Posting death-save rolls into the campaign chat roll feed (may be added later; see Open Questions).

## Decisions

### Decision 1: Represent life state with an explicit `lifeState` field plus a `deathSaves` counter

- Chosen: Add `deathSaves?: { successes: number; failures: number }` and `lifeState?: 'dying' | 'stable' | 'dead'` to `CombatantState`. Absent `lifeState` = active/conscious.
- Alternatives considered:
  - Derive everything from `hp <= 0` plus two booleans (`isStable`, `isDead`). Rejected: three consistent booleans to represent four states, logic scattered across components.
  - Store an "Unconscious" `StatusCondition`. Rejected: the conditions array is round-expiry ticked and would decay the state; also conflates DM-managed conditions with lifecycle.
- Rationale: One field is the single source of truth for the initiative-list badge and greying; `deathSaves` holds only the running tally (slots), cleared on resolution. Optional fields need no migration.
- Trade-offs: `lifeState` and `hp` must be kept coherent — enforced by routing all writes through `adjustHp` + the helper module.

### Decision 2: All transitions in a pure `lib/combat/deathSaves.ts` module

- Chosen: Export pure functions:
  - `usesDeathSaves(c: CombatantState): boolean` → `c.type === 'player'`.
  - `enterDying(c): Partial<CombatantState>` → `{ lifeState: 'dying', deathSaves: { successes: 0, failures: 0 } }`.
  - `applyDeathSaveRoll(c, d20: number): Partial<CombatantState>` → applies success / failure / nat20 (2 successes + revive at 1 HP, active) / nat1 (2 failures), then resolves (`stable` / `dead`) and clears counts on resolution.
  - `toggleDeathSaveSlot(c, kind: 'success' | 'failure', index: 0|1|2): Partial<CombatantState>` → manual slot toggle; re-resolves after toggle.
  - `applyDamageWhileDowned(c, { critical: boolean, damage: number }): Partial<CombatantState>` → +1 failure, or +2 / `dead` on critical or `damage >= c.maxHp`.
  - `clearDeathState(c): Partial<CombatantState>` → `{ lifeState: undefined, deathSaves: undefined }`.
- Alternatives considered: inline logic in `CombatantCard`. Rejected: untestable, duplicated between the roll path and the damage path.
- Rationale: One tested unit, consumed by the card and by `adjustHp`. Returns `Partial<CombatantState>` so callers pass straight to `onUpdate` / `updateCombatant`.
- Trade-offs: Helpers need the combatant + context, not just the counts, to compute revive-at-1-HP.

### Decision 3: `adjustHp` is the single writer for HP-driven transitions

- Chosen: In `CombatantCard.adjustHp`:
  - Damage path, PC, `resultHp === 0` and not already downed → merge `enterDying(combatant)`.
  - Damage path, PC, already `dying`/`stable` at 0 HP → merge `applyDamageWhileDowned(...)` (needs a `critical` flag from the damage UI; if the UI has no crit toggle, treat all as non-critical and rely on the `damage >= maxHp` instant-death rule — see Open Questions).
  - Healing path, PC, `resultHp >= 1` and `lifeState` set → merge `clearDeathState(combatant)`.
- Alternatives considered: a `useEffect` watching `hp`. Rejected: effects run after persist, causing double writes and race conditions with `saveCombatState`.
- Rationale: Keeps the existing "single mutation point" pattern already used for concentration clearing.
- Trade-offs: `adjustHp` grows; mitigated by delegating all logic to the helper module.

### Decision 4: Death-save rolls use `rollDie(20)` and render inline; no chat-feed dependency

- Chosen: The tracker's "Roll death save" button calls `rollDie(20)[0]`, shows the value inline (mirroring the `d20:X` initiative display), and feeds it to `applyDeathSaveRoll`. The last roll value is transient component state, not persisted.
- Alternatives considered: route through the dice-pool engine / campaign chat feed. Rejected for this change: initiative rolls already use `rollDie` directly without the engine or feed; adding a feed dependency widens scope. Left as a non-blocking follow-up.
- Rationale: Matches existing combat-dice convention (`buildInitiativeRoll`), keeps the dice engine lazy, satisfies "use the dice library to roll and record the impact" (impact = applied to tracker + shown).
- Trade-offs: No permanent log of individual death-save rolls; acceptable — the resolved outcome is what matters and undo is explicitly out of scope.

### Decision 5: Initiative-list visual states

- Chosen: Card/list styling keyed off `lifeState`:
  - unset → normal.
  - `dying` → normal card + visible death-save tracker + a "Dying" badge.
  - `stable` → greyed (reduced opacity), "Stable" badge, no tracker.
  - `dead` → greyed, "Dead" badge / `☠️`, no tracker.
  - Replace the current `hp <= 0 && '☠️'` heuristic (`CombatantCard.tsx:441`, `:674`) with `lifeState`-driven rendering; monsters at 0 HP keep `☠️` via a fallback (`hp <= 0 && !usesDeathSaves`).
- Alternatives considered: auto-skip greyed combatants in `nextTurn`. Rejected per requester — grey only.
- Rationale: Direct, matches requester's answers.
- Trade-offs: Two rendering call sites (card header + target list) to update.

## Proposal to Design Mapping

- Proposal element: Tracker shown automatically at 0 HP for PCs
  - Design decision: Decision 3 (`enterDying` in `adjustHp`) + Decision 5 (render when `usesDeathSaves && hp <= 0`)
  - Validation approach: unit test `enterDying`; component test that tracker renders for a player at 0 HP and not for a monster.
- Proposal element: 3 success + 3 failure slots, each individually toggleable
  - Design decision: Decision 2 (`toggleDeathSaveSlot`) + tracker sub-component
  - Validation approach: unit tests for toggle on/off and re-resolution; component test for slot clicks.
- Proposal element: Roll death save via dice library, record impact
  - Design decision: Decision 4 (`rollDie(20)` → `applyDeathSaveRoll`)
  - Validation approach: unit tests for each d20 bucket (2–19 success/failure by ≥10, nat 20, nat 1); mock `rollDie`.
- Proposal element: 3 successes → stable (cleared); 3 failures → dead (cleared)
  - Design decision: Decision 2 (`applyDeathSaveRoll` resolution) 
  - Validation approach: unit tests asserting `lifeState` and cleared `deathSaves`.
- Proposal element: Nat 20 = 2 successes + revive at 1 HP (always-on)
  - Design decision: Decision 2 (`applyDeathSaveRoll` nat20 branch)
  - Validation approach: unit test asserting `hp === 1`, `lifeState` undefined, `deathSaves` undefined.
- Proposal element: Damage while downed adds failure(s); crit / massive = instant death
  - Design decision: Decision 2 (`applyDamageWhileDowned`) + Decision 3 wiring
  - Validation approach: unit tests: normal hit +1, critical → dead, `damage >= maxHp` → dead.
- Proposal element: Healing above 0 clears death-save state
  - Design decision: Decision 2 (`clearDeathState`) + Decision 3 healing branch
  - Validation approach: unit test; component test healing a dying PC to ≥1 HP.
- Proposal element: Initiative list distinguishes active/dying/stable/dead; stable & dead greyed
  - Design decision: Decision 5
  - Validation approach: component/snapshot tests for each `lifeState`.
- Proposal element: Bosses/monsters do not make death saves
  - Design decision: Decision 2 (`usesDeathSaves` = `type === 'player'`)
  - Validation approach: unit test; component test that a monster at 0 HP shows `☠️` and no tracker.
- Proposal element: House-rule config follow-up issue
  - Design decision: create GitHub issue referencing #92 during apply
  - Validation approach: task checklist item; issue link recorded in tasks.md.

## Functional Requirements Mapping

- Requirement: A player combatant reaching 0 HP enters the dying state with an empty tracker.
  - Design element: `enterDying`, `adjustHp` damage branch.
  - Acceptance criteria reference: specs `death-saving-throws` — "Scenario: Player character drops to 0 HP".
  - Testability notes: pure-function unit test + `adjustHp` integration test with mocked `onUpdate`.
- Requirement: Each of the 6 slots can be toggled independently and the state re-resolves.
  - Design element: `toggleDeathSaveSlot`.
  - Acceptance criteria reference: "Scenario: DM toggles a death-save slot manually".
  - Testability notes: unit tests for toggle idempotency and resolution crossing.
- Requirement: Rolling a death save applies the correct outcome.
  - Design element: `applyDeathSaveRoll` + `rollDie(20)`.
  - Acceptance criteria reference: "Scenario: DM rolls a death save" (+ nat 20 / nat 1 scenarios).
  - Testability notes: mock `rollDie`; table-driven test across d20 values.
- Requirement: Third success stabilizes; third failure kills; counts cleared.
  - Design element: `applyDeathSaveRoll` / `toggleDeathSaveSlot` resolution.
  - Acceptance criteria reference: "Scenario: Third success", "Scenario: Third failure".
  - Testability notes: assert `lifeState` + `deathSaves === undefined`.
- Requirement: Damage to a downed PC adds failures; crit or damage ≥ maxHp is instant death.
  - Design element: `applyDamageWhileDowned`, `adjustHp`.
  - Acceptance criteria reference: "Scenario: Downed character takes damage", "Scenario: Massive damage instant death".
  - Testability notes: unit tests for each branch.
- Requirement: Healing a downed PC above 0 HP restores active state and clears the tracker.
  - Design element: `clearDeathState`, `adjustHp` healing branch.
  - Acceptance criteria reference: "Scenario: Downed character is healed".
  - Testability notes: unit + component test.
- Requirement: Initiative list shows distinct active/dying/stable/dead treatment; stable & dead greyed.
  - Design element: Decision 5 rendering.
  - Acceptance criteria reference: "Scenario: Initiative list reflects life state".
  - Testability notes: component tests asserting classes/badges per `lifeState`.
- Requirement: Non-player combatants are unaffected (die at 0 HP, no tracker).
  - Design element: `usesDeathSaves`.
  - Acceptance criteria reference: "Scenario: Monster reaches 0 HP".
  - Testability notes: component test with `type: 'monster'`.

## Non-Functional Requirements Mapping

- Requirement category: security / fairness
  - Requirement: Death-save d20s must be unbiased and crypto-secure.
  - Design element: reuse `rollDie(20)` (rejection sampling, `getCrypto`); no `Math.random`.
  - Acceptance criteria reference: covered by `lib/utils/dice.ts` existing guarantees; test asserts `deathSaves` helper calls `rollDie`.
  - Testability notes: spy on `rollDie` in the roll-action test.
- Requirement category: reliability
  - Requirement: Legacy persisted combat states (no new fields) behave as "active".
  - Design element: optional fields; all reads treat `undefined` as active.
  - Acceptance criteria reference: "Scenario: Combat state without death-save fields".
  - Testability notes: unit test passing a combatant with no `lifeState`/`deathSaves`.
- Requirement category: performance / operability
  - Requirement: Rendering the tracker must not eagerly load the dice 3D engine.
  - Design element: Decision 4 — `rollDie` is a pure util, no engine import at card level.
  - Acceptance criteria reference: n/a (static import review).
  - Testability notes: verify no `dice-box` import added to `CombatantCard`.
- Requirement category: reliability
  - Requirement: `lifeState` and `hp` never contradict.
  - Design element: Decision 3 — single writer.
  - Acceptance criteria reference: "Scenario: Downed character is healed", "Scenario: Stable character takes damage".
  - Testability notes: integration tests through `adjustHp`.

## Risks / Trade-offs

- Risk/trade-off: The damage UI may not expose a "critical hit" flag.
  - Impact: Crit-doubles-failure rule can't be auto-applied.
  - Mitigation: Ship with the `damage >= maxHp` instant-death rule always active and a manual failure-slot toggle; add a crit toggle only if one already exists in the damage UI (confirmed during apply). Recorded as an Open Question.
- Risk/trade-off: Two card render sites (`:441`, `:674`) plus `ActiveCombatView` list styling.
  - Impact: Missed site → inconsistent display.
  - Mitigation: Centralize the badge/greying decision in a small helper (`lifeStateDisplay(combatant)`), used by all sites; component tests per site.
- Risk/trade-off: `applyDeathSaveRoll` needs combatant context (for revive-at-1) not just counts.
  - Impact: Slightly larger helper signatures.
  - Mitigation: Accept `CombatantState`, return `Partial<CombatantState>`; consistent with existing combat utils.

## Rollback / Mitigation

- Rollback trigger: Death-save flow corrupts combat state, blocks turn advancement, or causes persistent render errors in `ActiveCombatView`.
- Rollback steps: Revert the feature branch merge (single PR). The new `CombatantState` fields are optional and additive; no code depends on them existing.
- Data migration considerations: None. Persisted `CombatState` documents may contain `deathSaves` / `lifeState` after rollback; these are ignored by pre-change code (unknown optional fields) and can be left in place or cleared lazily on next combat save.
- Verification after rollback: Load an existing combat, drop a PC to 0 HP, confirm pre-change `☠️` behavior; run `tests/unit/combat` suite.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch; do not merge with red CI. Lint/type/test failures in touched files block merge. Re-run after each fix.
- If security checks fail (Codacy / verity gate): Address the finding. Only `verity waive` for a human-accepted risk with a cited source per project policy; never to bypass a block.
- If required reviews are blocked/stale: Request re-review after pushing changes; resolve every PR comment before merge (project rule). Do not use `--admin` / branch-protection bypass.
- Escalation path and timeout: If CI infra (not the change) is broken for > 1 working day, note it on the PR and raise with the repo owner (Doug); do not merge around required checks.

## Open Questions

- Does the damage-entry UI in `CombatantCard` have (or should it gain) a "critical hit" toggle so `applyDamageWhileDowned` can auto-apply the double-failure rule? Default if not: rely on `damage >= maxHp` instant death + manual slot toggle. Non-blocking for apply.
- Should death-save rolls also post to the campaign chat roll feed (like a shared table log)? Default: no, inline display only, matching initiative rolls. Non-blocking; candidate follow-up.
- On a nat-20 revive, should the (now cleared) successes still flash in the UI before clearing? Default: skip the animation, show a "Nat 20 — revived at 1 HP" inline note. Non-blocking.
