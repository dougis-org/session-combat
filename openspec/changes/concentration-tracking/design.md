## Context

- Relevant architecture: `CombatantState` (lib/types.ts:527) is the in-memory runtime record for each combatant during a session. It extends `CreatureStats` and already carries optional runtime fields (`tempHp`, `activeDamageEffects`, `legendaryActionsRemaining`). Damage is applied in `CombatantCard.tsx` via `applyDamage()` / `applyDamageWithType()` from `lib/utils/combat.ts`; both return the post-damage state as a plain object. The `CombatantDetailPanel` component provides the DM with a per-combatant configuration surface.
- Dependencies: `lib/utils/combat.ts` — damage helpers; `lib/types.ts` — type model; `lib/components/CombatantCard.tsx` — damage application and card rendering; `lib/components/CombatantDetailPanel.tsx` — combatant configuration UI; existing notification/chat channel (to be investigated per risk in proposal).
- Interfaces/contracts touched: `CombatantState` (add two optional fields), `applyDamageWithType` return value is already `{ hp, tempHp, effectiveDamage }` — no signature change needed.

## Goals / Non-Goals

### Goals

- Add `concentratingOn` and `pendingConSaveDC` to `CombatantState` as optional fields
- Pure helper `calcConSaveDC` computes `max(10, floor(effectiveDamage / 2))`
- Damage path in `CombatantCard` sets `pendingConSaveDC` when `concentratingOn` is set and `effectiveDamage > 0`; clears `concentratingOn` (and `pendingConSaveDC`) when `hp` reaches 0
- Card renders a concentration badge (spell name pill) and a DC prompt when `pendingConSaveDC` is set
- DC prompt is DM-visible only; a CON-save notification fires to DM and the affected player
- `CombatantDetailPanel` gains a spell-name text input and an "End Concentration" button

### Non-Goals

- DB persistence (see proposal Non-Goals)
- Automatic save resolution
- Player-facing combat UI

## Decisions

### D1: State fields on `CombatantState`, not a separate object

- Chosen: Add `concentratingOn?: string` and `pendingConSaveDC?: number` directly to `CombatantState`.
- Alternatives considered: Separate `concentrationState` sub-object; store only in component local state.
- Rationale: Consistent with how `tempHp`, `activeDamageEffects`, and `legendaryActionsRemaining` are handled — all are optional runtime-only fields on `CombatantState`. Keeps the state shape flat and co-located with the combatant.
- Trade-offs: Slightly widens `CombatantState` — acceptable given both fields are optional and zero-cost when undefined.

### D2: DC computed at damage time and stored on state, not recomputed on render

- Chosen: `calcConSaveDC(effectiveDamage)` is called in the damage handler; result is written to `pendingConSaveDC` on the combatant state update.
- Alternatives considered: Derive DC in the render function from stored damage history.
- Rationale: The effective damage that drove the save is not otherwise stored; computing and storing the DC at damage time is simpler and avoids dependency on a separate damage history field. Consistent with how `effectiveDamage` is already returned by `applyDamageWithType` but not persisted.
- Trade-offs: `pendingConSaveDC` must be explicitly cleared (dismiss button, next damage hit, or HP-0 clear).

### D3: Auto-clear `concentratingOn` at HP = 0 in the damage handler

- Chosen: When the post-damage `hp === 0`, the state update also sets `concentratingOn: undefined` and `pendingConSaveDC: undefined`.
- Alternatives considered: Watch for HP 0 in a `useEffect`; handle in `useCombat` hook.
- Rationale: The damage handler already has the new HP value at the point of the state update — no additional pass needed. Mirrors how temp HP drain is handled in the same path.
- Trade-offs: None significant; the change is local to the damage handler callback.

### D4: DC prompt displays on the card; CON-save notice fires via a new callback prop

- Chosen: `pendingConSaveDC` renders an inline alert on `CombatantCard` visible to the DM. `CombatantCard` fires a new `onConSaveRequired?: (dc: number) => void` callback prop. `ActiveCombatView` implements the callback: it extracts the character ID from the combatant ID (pattern `character-${character.id}`), looks up the `Character` in the `characters[]` array to get `userId`, then posts a `CampaignMessage` with `visibility: { scope: "direct"; toUserId: character.userId }` to the campaign chat/stream API. A separate DM-visible alert/toast fires simultaneously.
- Alternatives considered: Toast only; chat message only; passing `characters[]` into `CombatantCard`; no player notification.
- Rationale: `CombatantState` carries no `userId` field — confirmed by code inspection. Player userId must be resolved via the `character-${id}` combatant ID pattern against the `characters[]` array available in `ActiveCombatView`. Keeping this logic in `ActiveCombatView` (not `CombatantCard`) respects separation of concerns: the card handles HP/damage rendering, the view handles multi-user orchestration. The campaign message API already supports `{ scope: "direct"; toUserId }` visibility, so no new infrastructure is needed.
- Trade-offs: Adds one prop to `CombatantCardProps`. Non-player combatants (monsters, lair) have no character ID match — the callback fires for player-type combatants only; for monster-type, only the DM alert fires.

### D5: `CombatantDetailPanel` is the surface for setting / ending concentration

- Chosen: Add a labeled text input ("Concentrating on spell") and an "End Concentration" button to `CombatantDetailPanel`.
- Alternatives considered: Inline input on the card itself; a dedicated modal.
- Rationale: The detail panel is already the DM's configuration surface for a combatant. Adding to it avoids cluttering the card row and is consistent with the existing UX pattern.
- Trade-offs: The DM must open the panel to set concentration; they cannot do it directly from the card row. Acceptable given the DM typically sets concentration at the start of a spell, not mid-action.

## Proposal to Design Mapping

- Proposal element: `concentratingOn?: string` and `pendingConSaveDC?: number` on `CombatantState`
  - Design decision: D1
  - Validation approach: TypeScript compile check; unit tests assert fields are present/absent as expected

- Proposal element: `calcConSaveDC(effectiveDamage)` helper
  - Design decision: D2
  - Validation approach: Unit tests covering boundary values (0, 1, 19, 20, 21)

- Proposal element: Auto-clear at 0 HP
  - Design decision: D3
  - Validation approach: Unit test: apply lethal damage to concentrating combatant, assert `concentratingOn` and `pendingConSaveDC` are cleared

- Proposal element: DC prompt on card (DM-only), notification to player
  - Design decision: D4
  - Validation approach: RTL test asserts DC prompt renders when `pendingConSaveDC` is set; `onConSaveRequired` callback verified via mock; `ActiveCombatView` test asserts campaign message POST with `{ scope: "direct"; toUserId }` for player-type combatants

- Proposal element: Set/end concentration via detail panel
  - Design decision: D5
  - Validation approach: RTL test for input and button in `CombatantDetailPanel`

## Functional Requirements Mapping

- Requirement: Mark a combatant as concentrating on a named spell
  - Design element: `concentratingOn` field; text input in `CombatantDetailPanel`
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Set Concentration
  - Testability notes: RTL test sets spell name via input, asserts `onUpdate` called with `concentratingOn` set

- Requirement: Auto-calculate and display CON save DC when concentrating combatant takes damage
  - Design element: `calcConSaveDC`; damage handler writes `pendingConSaveDC`; card renders DC prompt
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — CON Save DC Display
  - Testability notes: Unit test for `calcConSaveDC`; RTL test asserts DC badge appears after damage

- Requirement: Visual indicator (spell name shown) when concentrating
  - Design element: Spell name badge rendered when `concentratingOn` is set
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Concentration Badge
  - Testability notes: RTL test asserts pill/badge with spell name is visible

- Requirement: "End Concentration" button to manually clear
  - Design element: Button in `CombatantDetailPanel` clears `concentratingOn` and `pendingConSaveDC`
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — End Concentration
  - Testability notes: RTL test clicks button, asserts `onUpdate` called with both fields undefined

- Requirement: Concentration clears automatically at 0 HP
  - Design element: D3 — damage handler conditional
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Auto-Clear at 0 HP
  - Testability notes: Unit/RTL test applies lethal damage, asserts fields cleared

- Requirement: Only one spell at a time (new replaces old)
  - Design element: Single `string` field (not array); input in panel overwrites on save
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Single Spell Enforcement
  - Testability notes: Set two spell names in sequence, assert only the second remains

- Requirement: CON save notice to DM and affected player
  - Design element: `CombatantCard` fires `onConSaveRequired(dc)` callback; `ActiveCombatView` resolves player userId via `characters[]` and posts `CampaignMessage` with `{ scope: "direct"; toUserId }` to `/api/campaigns/${campaignId}/messages` (or equivalent)
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Player Notification
  - Testability notes: Mock `onConSaveRequired` callback in `CombatantCard` RTL tests; mock `fetch` in `ActiveCombatView` tests and assert direct-message POST for player-type combatants; assert no player message for monster-type combatants

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Immunity (effectiveDamage = 0) must not trigger a save
  - Design element: `calcConSaveDC` is only called when `effectiveDamage > 0`; DC = max(10, floor(0/2)) = 10 would be wrong (0 damage = no save required by RAW)
  - Acceptance criteria reference: specs/concentration-tracking/spec.md — Immunity No-Op
  - Testability notes: Unit test: concentrating combatant immune to damage type → no `pendingConSaveDC` set

- Requirement category: performance
  - Requirement: Concentration check adds no perceptible latency to damage application
  - Design element: `calcConSaveDC` is O(1) integer math; no I/O; no additional renders beyond existing state update
  - Acceptance criteria reference: n/a (not measurable at unit level)
  - Testability notes: No dedicated perf test; complexity is trivially low

- Requirement category: operability
  - Requirement: No DB migration or schema change required
  - Design element: In-memory only; no storage layer touched
  - Acceptance criteria reference: proposal Non-Goals
  - Testability notes: Confirm no changes to `lib/storage.ts` or any MongoDB collection shape

## Risks / Trade-offs

- Risk/trade-off: Player notification requires combatant-to-player ownership linkage
  - Impact: **Resolved.** `CombatantState` carries no `userId`. Player combatant IDs follow `character-${character.id}` (set in `useCombat.ts`). `ActiveCombatView` has `characters[]` from `useCombat`, each with a `userId`. Lookup: strip `character-` prefix → find `Character` by `id` → use `character.userId`. Campaign chat already supports `{ scope: "direct"; toUserId }` messages. Full player-targeted notification is achievable.
  - Mitigation: N/A — resolved by investigation. Monster-type combatants have no character match; their notifications go to DM only (no change to monster gameplay behavior).

- Risk/trade-off: `pendingConSaveDC` persists until explicitly dismissed
  - Impact: Cosmetic confusion if the DM forgets to dismiss after the save is resolved
  - Mitigation: Auto-clear on next damage event to the same combatant; prominent dismiss (×) button

## Rollback / Mitigation

- Rollback trigger: Regressions in existing `CombatantCard` HP or damage tests; unexpected TypeScript errors from new optional fields.
- Rollback steps: Revert the PR. No DB migration means no data to undo.
- Data migration considerations: None — in-memory only.
- Verification after rollback: `npm run test:unit` passes; `npm run test:integration` passes.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failure in the feature branch.
- If security checks fail: Do not merge. Triage within 24 hours.
- If required reviews are blocked/stale: Re-request after 48 hours; escalate to maintainer after 72 hours.
- Escalation path and timeout: Tag maintainer on the PR after 72-hour review stale window.

## Open Questions

- No open questions remain. All design decisions were finalised during the exploration session and confirmed by code investigation of `lib/hooks/useCombat.ts`, `lib/types.ts`, `lib/components/CombatantCard.tsx`, `lib/components/ActiveCombatView.tsx`, and `lib/hooks/useCampaignStream.ts`.
