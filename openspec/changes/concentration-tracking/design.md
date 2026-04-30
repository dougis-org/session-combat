## Context

- Relevant architecture: Combat tracker UI (`app/combat/page.tsx`), `CombatantCard` component, `CombatantState` type
- Dependencies: Issue #146 (spell collection) — will provide dropdown data, but free-text fallback always works
- Interfaces/contracts touched: `CombatantState` interface (`lib/types.ts`), `adjustHp()` function behavior, turn advance logic

## Goals / Non-Goals

### Goals

- Track which combatant is concentrating and on what spell
- Show DC reminder when damage is dealt to a concentrator
- Auto-clear concentration when combatant reaches 0 HP
- Provide manual end button with confirmation toast
- Keep UI non-blocking — no dialogs that halt combat flow

### Non-Goals

- Automating the CON save roll itself
- Combat-level toggle (UI only appears when combatant has concentration set)
- Spell validation or list management (deferred to #146)
- HP history integration

## Decisions

### Decision 1: Data Model

- Chosen: Add `concentrationSpell?: string` to `CombatantState`
- Alternatives considered: Separate `ConcentrationState` object, concentration as special condition type
- Rationale: Simplest possible addition. Single optional string field. No new types, no new collections. Logic lives in UI layer.
- Trade-offs: No built-in validation of spell names, but free-text fallback ensures always works before #146 ships

### Decision 2: DC Calculation

- Chosen: `dc = max(10, Math.floor(damageDealt / 2))`
- Alternatives considered: Custom formula per-spell (out of scope), always DC 10
- Rationale: Matches D&D 5e PHB rule exactly. "Half damage taken, rounded down, minimum 10"
- Trade-offs: None — this is the defined rule

### Decision 3: DC Badge Trigger & Clear

- Chosen: Badge appears immediately after damage to concentrator. Clears on turn advance (`nextTurn()`)
- Alternatives considered: Badge persists until manually dismissed
- Rationale: Badge is a momentary reminder. Once DM asks for the save roll, DC is no longer relevant. Turn advance is the natural "acknowledge and move on" gesture
- Trade-offs: If multiple damage events happen same turn, badge updates to latest DC — correct per rules

### Decision 4: Auto-Clear Trigger

- Chosen: `hp === 0` triggers auto-clear (not `hp <= 0`)
- Alternatives considered: `hp <= 0` (would trigger on temp HP cushion)
- Rationale: D&D rule uses actual HP, not temp HP. Someone with 5 temp HP who takes 10 damage has 0 HP but is not unconscious — concentration should persist
- Trade-offs: Slightly more complex condition (`hp === 0` not `hp <= 0`)

### Decision 5: Toast Notifications

- Chosen: Non-blocking toasts for both manual end and auto-clear on 0 HP
- Alternatives considered: No notification, alert() dialog
- Rationale: Toasts are visible but don't halt combat. DM sees the message and it fades — sufficient for awareness without disruption
- Trade-offs: DM might miss a toast if they look away — but this is acceptable for non-critical info

### Decision 6: Concentration Field in Detail Popup

- Chosen: Always visible free-text input, dropdown for spell selection when focus (future: from #146)
- Alternatives considered: Only visible on click, separate "Concentration" panel
- Rationale: Discoverability — if DM is looking at the detail popup, they should immediately see if/where to set concentration. Simple and clear
- Trade-offs: More fields in popup, but concentration is a single field and doesn't add much complexity

## Proposal to Design Mapping

| Proposal Element | Design Decision | Validation Approach |
|-----------------|------------------|---------------------|
| Add `concentrationSpell` field | Decision 1 | Type exists, field optional, persists to API |
| Concentration indicator in row | CombatantCard renders 🔮 + spell name + [End] | Visual inspection |
| End Concentration button | onClick clears field, shows toast | Unit test |
| DC badge on damage | `adjustHp` detects concentrator, calculates DC, stores in local state | Unit test |
| Auto-clear on 0 HP | `adjustHp` checks `hp === 0` after damage, clears if concentrating | Unit test |
| DC badge clears on turn advance | `nextTurn` resets DC badge state | E2E test |
| Concentration field in detail popup | Present in detail popup, saves to `concentrationSpell` | UI test |

## Functional Requirements Mapping

- Requirement: Combatant marked as concentrating shows 🔮 indicator
  - Design element: `CombatantCard` checks `concentrationSpell` and renders indicator
  - Acceptance criteria reference: (from #93 AC)
  - Testability notes: Render with/without field, verify indicator shows/hides

- Requirement: DC badge appears when damage dealt to concentrator
  - Design element: `adjustHp` calculates and displays DC
  - Acceptance criteria reference: AC: "auto-calculate and display CON save DC"
  - Testability notes: Mock damage to concentrator, verify badge appears with correct DC

- Requirement: End button clears concentration with toast
  - Design element: `endConcentration` handler + toast system
  - Acceptance criteria reference: AC: '"End concentration" button to manually clear'
  - Testability notes: Click button, verify field cleared, toast shown

- Requirement: Concentration auto-clears at 0 HP
  - Design element: `adjustHp` checks `hp === 0` post-damage
  - Acceptance criteria reference: AC: "Concentration clears automatically if knocked unconscious"
  - Testability notes: Set hp to 0 via damage, verify concentration cleared, toast shown

- Requirement: DC badge clears on turn advance
  - Design element: `nextTurn` resets per-turn DC badge state
  - Acceptance criteria reference: Implicit from non-blocking UX
  - Testability notes: Advance turn, verify badge no longer visible

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Non-blocking UI — no alert() or confirm()
  - Design element: Toast system, DC badge only appears in-row
  - Acceptance criteria reference: "The DC prompt should be non-blocking"
  - Testability notes: Damage flow produces no blocking dialogs

- Requirement category: performance
  - Requirement: DC calculation is O(1), no recomputation
  - Design element: Simple formula, local state
  - Acceptance criteria reference: N/A (implicit)
  - Testability notes: Measure render time with many combatants

## Risks / Trade-offs

- Risk: DC badge clutters UI when many combatants concentrating
  - Impact: Visual noise during combat
  - Mitigation: Badge is single line, clears on turn advance, only appears after damage
  - Trade-off accepted: Benefit outweighs noise for typical combat size

- Risk: Spell name is free-form with no validation
  - Impact: Misspelled names could cause confusion
  - Mitigation: #146 will add spell list dropdown; free-text always works
  - Trade-off accepted: Field is optional, DM responsible for accuracy

- Risk: Temp HP edge case (`hp === 0` but not unconscious)
  - Impact: Concentration might persist when player expects it to drop
  - Mitigation: Rule is clear (actual HP, not temp), documented in proposal
  - Trade-off accepted: Correct behavior per D&D rules

## Rollback / Mitigation

- Rollback trigger: If deployment causes unexpected behavior (e.g., DC calculation wrong)
- Rollback steps: Revert `concentrationSpell` field from `CombatantState`, remove UI elements from `CombatantCard`
- Data migration considerations: Existing `concentrationSpell` values become orphaned — acceptable since feature is new
- Verification after rollback: Load existing combat, combatants with/without field render correctly

## Operational Blocking Policy

- If CI checks fail: Block merge. Fix test/code until CI passes.
- If security checks fail: Block merge. Address any security concerns before proceeding.
- If required reviews are blocked/stale: Ping PR reviewer. After 48h without response, proceed with merge if other checks pass.
- Escalation path: Tag repo maintainer for review.

## Open Questions

- Question: Should toast auto-dismiss or require manual dismiss?
  - Answer: Auto-dismiss after 3 seconds (matches existing toast pattern in codebase)