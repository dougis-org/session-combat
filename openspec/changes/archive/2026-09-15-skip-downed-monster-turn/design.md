## Context

- Relevant architecture: `nextTurn()` in `lib/hooks/useCombat.ts:349-378` is
  the sole mutator of `CombatState.currentTurnIndex` / `currentRound`. The
  active-combat UI (`ActiveCombatView.tsx`) derives the highlighted
  combatant purely by indexing `combatState.combatants[currentTurnIndex]`
  and invokes `nextTurn()` on a "Next Turn" action — there is no
  intermediate turn-selection logic anywhere else.
- Dependencies:
  - `processRoundEnd(combatants)` (existing) — decrements condition
    durations, collects/removes expired conditions, returns
    `{ updatedCombatants, expiring }`. Currently called once per `nextTurn()`
    call, only when wrapping past the end of the list.
  - `resetIncomingLegendaryPool(combatants, nextIndex)` (existing) — resets
    the legendary-action pool for whichever combatant is about to act.
    Currently called once, for the single landing index.
  - `usesDeathSaves(c)` (`lib/combat/deathSaves.ts`) — confirms only
    `type === 'player'` combatants use death saves; monsters/lair never get
    `lifeState`.
- Interfaces/contracts touched: only the internal logic of `nextTurn()`.
  `CombatantState`, `CombatState`, and all other exported hook functions
  (`updateCombatant`, `rollInitiative`, `restartRound`, etc.) are unchanged.
  No new fields are added to `CombatantState` or `CombatState`.

## Goals / Non-Goals

### Goals

- `nextTurn()` skips forward over any combatant where
  `type === 'monster' && hp <= 0`, landing on the next combatant able to act.
- Round-end processing (`processRoundEnd`, condition-expiry alert) and
  `currentRound` increment fire once per wrap crossed during the skip,
  identically to the existing single-wrap behavior.
- `resetIncomingLegendaryPool` is applied only to the final landing index.
- The loop is strictly bounded (at most `combatants.length` steps); if no
  eligible combatant is found, `nextTurn()` is a no-op that alerts the DM.
- Players and `lair` combatants are never skipped, regardless of HP or
  `lifeState`.

### Non-Goals

- No change to how HP reaches 0, to `deathSaves.ts`, or to `applyHpChange.ts`.
- No new UI state, prop, or component for "skipped" turns.
- No change to `restartRound()` or `rollInitiative()`.
- No persistence/schema change — this is pure client-side turn-advance logic
  operating on the existing `CombatantState`/`CombatState` shapes.

## Decisions

### Decision 1: Skip predicate is `type === 'monster' && hp <= 0`

- Chosen: `const isDownedMonster = (c: CombatantState) => c.type === 'monster' && c.hp <= 0;`
  extracted as a small local helper (or inlined — implementer's call) inside
  `useCombat.ts`, used only by `nextTurn()`.
- Alternatives considered:
  - Checking `lifeState === 'dead'` instead of `hp <= 0`: rejected because
    monsters never get a `lifeState` set (`usesDeathSaves` gates that
    entirely to players) — `lifeState` would always be `undefined` for
    monsters, making this check a no-op.
  - Checking `hp <= 0` without the `type === 'monster'` guard: rejected
    because it would also skip dying players (breaks death saves) and, in
    theory, `lair` combatants if they ever had an `hp` of 0.
- Rationale: matches the existing display logic in
  `lifeStateDisplay()` (`lib/combat/deathSaves.ts:144`), which already
  treats `hp <= 0` with no `lifeState` as "this (non-player) combatant is
  dead" — this change makes turn advancement consistent with what's already
  displayed.
- Trade-offs: none significant; this is a pure, cheap, side-effect-free
  predicate evaluated fresh on every `nextTurn()` call, so healed monsters
  automatically stop being skipped without any extra bookkeeping.

### Decision 2: Bounded skip-loop replaces the single increment, reusing existing round-end/legendary-pool calls per wrap

- Chosen: Replace the single `if (nextIndex >= length) { ... }` block with a
  loop that runs at most `combatants.length` times. Each iteration:
  1. Increments the working index.
  2. If it wrapped past the end, resets to `0`, increments the working
     round, and applies `processRoundEnd` to the working combatants array
     (collecting/alerting expired conditions exactly as today).
  3. Checks the predicate from Decision 1 against the working combatants
     array at the new index; if not a downed monster, stop looping.
  After the loop, if a valid index was found, apply
  `resetIncomingLegendaryPool(workingCombatants, foundIndex)` and
  `saveCombatState(...)` exactly as today. If the loop exhausts all
  `combatants.length` iterations without finding an eligible combatant,
  `nextTurn()` returns without calling `saveCombatState` at all (true
  no-op) and calls `alert(...)` to tell the DM no combatant can act.
- Alternatives considered:
  - Recursive re-invocation of `nextTurn()` after landing on a downed
    monster: rejected — harder to reason about round/legendary-pool
    call-once-per-wrap semantics, and risks re-entrant `saveCombatState`
    calls mid-computation.
  - Capping round-end processing to "at most once per `nextTurn()` call"
    even if multiple wraps occur: rejected per proposal's explicit decision
    — the agreed behavior is that each wrap crossed during a skip is
    treated identically to today's single-wrap case, so condition-duration
    bookkeeping stays correct even in a pathological "almost everyone is
    dead" encounter.
- Rationale: keeps the change additive/local to `nextTurn()`'s existing
  control flow — the wrap-handling and legendary-pool-reset code paths are
  reused unmodified, just invoked from inside a bounded loop instead of a
  single `if`.
- Trade-offs: the loop body duplicates a small amount of "did we wrap"
  bookkeeping across iterations that the original single-shot code expressed
  as a flat `if`; this is an acceptable, contained complexity increase for a
  ~30-line function.

### Decision 3: All-combatants-unable-to-act is a no-op + alert, not a fallback landing

- Chosen: if the bounded loop exhausts `combatants.length` iterations
  without finding a combatant that can act, `nextTurn()` returns early
  (no state mutation) and calls
  `alert('No combatants remain able to take a turn.')`.
- Alternatives considered:
  - Falling back to landing on index 0 regardless: rejected per the
    requester's explicit choice — silently landing on a dead monster would
    look like a bug (turn pointer highlighting a corpse) rather than
    communicating that the encounter needs DM attention (e.g. everyone
    left is dead, or downed-but-not-dead players need manual review).
- Rationale: consistent with the existing `alert(...)` pattern already used
  in `nextTurn()` for expiring conditions — this is a UX precedent already
  established in this exact function.
- Trade-offs: this is a genuinely rare edge case (every monster dead is the
  normal end-of-combat state, but by then the DM is expected to click "End
  Combat" rather than "Next Turn" again); the no-op is safe and recoverable
  either way.

## Proposal to Design Mapping

- Proposal element: skip condition `type === 'monster' && hp <= 0`, never
  skip players/lair.
  - Design decision: Decision 1.
  - Validation approach: unit tests asserting a player at 0 HP is not
    skipped, a `lair` combatant is not skipped, and a monster at 0 HP is
    skipped.
- Proposal element: bounded multi-skip loop; round-end processing fires per
  wrap crossed, same as single-step today.
  - Design decision: Decision 2.
  - Validation approach: unit tests for single skip, multiple consecutive
    skips, and a skip that crosses the round wrap (round increments once,
    `processRoundEnd` called once — a single bounded lap can cross the wrap
    boundary at most once).
- Proposal element: all-dead edge case is a no-op + DM alert.
  - Design decision: Decision 3.
  - Validation approach: unit test constructs a combat state where every
    combatant is a monster at 0 HP, calls `nextTurn()`, asserts
    `saveCombatState`/state is unchanged and `alert` was called.
- Proposal element: `resetIncomingLegendaryPool` applies only to the final
  landing index.
  - Design decision: Decision 2 (step 4 of the loop).
  - Validation approach: unit test with a skipped monster that has a
    legendary pool asserts its pool is untouched, while the landing
    combatant's pool is reset.
- Proposal element: no special revival handling.
  - Design decision: Decision 1 (predicate reads live `hp` each call).
  - Validation approach: unit test that heals a previously-skipped monster
    above 0 HP, then calls `nextTurn()` again in a later round and asserts
    it is no longer skipped.

## Functional Requirements Mapping

- Requirement: monster at 0 HP is skipped when it would otherwise be the
  next turn.
  - Design element: Decision 1 + Decision 2.
  - Acceptance criteria reference: `specs/*.md` scenario "monster at 0 HP is
    skipped".
  - Testability notes: pure function of `CombatState` input/output; no
    mocking needed beyond `alert`/`confirm` already stubbed in existing
    `useCombat` tests.
- Requirement: player at 0 HP (`lifeState: 'dying'`) is never skipped.
  - Design element: Decision 1 (type guard).
  - Acceptance criteria reference: `specs/*.md` scenario "dying player keeps
    their turn".
  - Testability notes: same as above.
- Requirement: `lair` combatants are never skipped.
  - Design element: Decision 1 (type guard).
  - Acceptance criteria reference: `specs/*.md` scenario "lair combatant is
    never skipped".
  - Testability notes: same as above.
- Requirement: multiple consecutive downed monsters are all skipped in one
  `nextTurn()` call.
  - Design element: Decision 2 (loop).
  - Acceptance criteria reference: `specs/*.md` scenario "consecutive downed
    monsters are all skipped".
  - Testability notes: deterministic given a fixed `combatants` array order.
- Requirement: skipping across the end of the list still increments
  `currentRound` and runs `processRoundEnd` exactly once for the (at most
  one) wrap crossed.
  - Design element: Decision 2 (step 2, reused per iteration).
  - Acceptance criteria reference: `specs/*.md` scenario "Skip crosses the
    round wrap".
  - Testability notes: assert `currentRound` increments by exactly 1 and
    the condition-expiry side effect (existing `alert` call) fires exactly
    once when a wrap is crossed during a skip.
- Requirement: when no combatant can act, `nextTurn()` is a no-op and alerts
  the DM.
  - Design element: Decision 3.
  - Acceptance criteria reference: `specs/*.md` scenario "no combatant can
    act".
  - Testability notes: assert `saveCombatState` (or equivalent persisted
    state) is unchanged and `alert` is called with a distinct message.
- Requirement: legendary pool reset applies only to the final landing
  combatant.
  - Design element: Decision 2 (step 4).
  - Acceptance criteria reference: `specs/*.md` scenario "legendary pool
    reset targets only the landing combatant".
  - Testability notes: inspect `legendaryActionsRemaining` on both the
    skipped and landing combatants after the call.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: `nextTurn()` must never enter an infinite loop, regardless
    of `combatants` contents (including an empty array or all-monsters-dead
    array).
  - Design element: Decision 2/3 (hard bound at `combatants.length`
    iterations).
  - Acceptance criteria reference: `specs/*.md` scenario "no combatant can
    act" and a defensive test with an empty `combatants` array.
  - Testability notes: test asserts the function returns within a bounded
    number of iterations/time even under pathological input; no timers or
    async involved, so a plain synchronous unit test suffices.
- Requirement category: performance
  - Requirement: the skip loop must stay O(n) in the number of combatants
    per `nextTurn()` call (no repeated full-array scans per step).
  - Design element: Decision 2 (single pass, index-based).
  - Acceptance criteria reference: implicit — no dedicated perf test needed
    given combatant counts are always small (single encounters, not
    thousands of combatants); code-review check is sufficient.
  - Testability notes: N/A (no perf test planned; reasoned about at
    review-time given realistic combatant counts).

## Risks / Trade-offs

- Risk/trade-off: generalizing the single-`if` wrap check into a loop
  increases the cyclomatic complexity of `nextTurn()`.
  - Impact: slightly harder to read at a glance; higher chance of a subtle
    bug in the loop bookkeeping (index/round/processRoundEnd ordering).
  - Mitigation: keep the loop body as close as possible to the existing
    single-shot logic (same operations, just re-entered), and cover it with
    the full matrix of unit tests described in this design's mapping
    sections before merging. Note: because the loop is bounded at exactly
    `combatants.length` iterations (one full lap of the initiative list),
    it can cross the end-of-list wrap boundary at most once per call — a
    full lap visits every position exactly once, so multiple round
    increments within a single `nextTurn()` call are not possible and do
    not need to be handled.
- Risk/trade-off: alerting via `alert(...)` for the all-dead case blocks the
  UI thread synchronously, same as the existing condition-expiry alert.
  - Impact: acceptable — this is already the established pattern in this
    exact function for a rare, DM-attention-worthy event.
  - Mitigation: none needed; consistent with existing UX.

## Rollback / Mitigation

- Rollback trigger: if the new skip logic is found in testing/production to
  incorrectly skip a combatant that should have acted (most likely a
  mis-scoped predicate), or to occasionally freeze/no-op when a valid
  combatant did exist.
- Rollback steps: revert the `nextTurn()` change in
  `lib/hooks/useCombat.ts` to the prior single-increment implementation
  (pure function change, no data migration involved, trivial `git revert`
  of the implementing commit(s)).
- Data migration considerations: none — `CombatState`/`CombatantState`
  shapes are unchanged; no persisted data needs migration either direction.
- Verification after rollback: existing `nextTurn()` unit/integration tests
  (pre-change baseline) pass again; manual smoke test of "Next Turn" during
  an active combat.

## Operational Blocking Policy

- If CI checks fail: fix the underlying issue before merging; this change
  has no infrastructure/deploy surface, so CI failures are almost certainly
  either a lint/type error or a failing unit test in the new skip-loop
  coverage — treat as a normal blocking failure.
- If security checks fail: this change touches no I/O, network, auth, or
  persistence boundary (`nextTurn()` operates only on already-loaded
  in-memory `CombatState`) — a security-tool finding here would be
  unexpected; investigate as a potential false positive but do not waive
  without a human-reviewed reason per project policy.
- If required reviews are blocked/stale: ping the reviewer directly; this is
  a small, self-contained change with no urgency-based exception to the
  normal review-wait policy.
- Escalation path and timeout: no special escalation path — follow the
  project's normal PR review cadence; nothing about this change warrants
  bypassing branch protection or admin-merging.

## Open Questions

None — all design ambiguities were resolved during the preceding explore
session and are captured as Decisions 1-3 above.
