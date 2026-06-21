## GitHub Issues

- #93

## Why

- Problem statement: D&D 5e has a concentration mechanic where spells require sustained focus. When a concentrating creature takes damage it must succeed on a Constitution saving throw (DC = max(10, half the damage taken)) or lose the spell. The app currently has no way to track which combatant is concentrating, no way to surface the required save, and no visual indicator during combat.
- Why now: Issue #93 is open and unblocked. The damage pipeline (`applyDamageWithType`) already returns `effectiveDamage`, and `CombatantState` already carries `abilityScores.constitution` — the mechanic slots in cleanly without touching unrelated systems.
- Business/user impact: Without this, the DM must mentally track all concentrating spells during a fast-moving combat, regularly forgetting to call for saves. This is one of the most frequently missed rules at the table.

## Problem Space

- Current behavior: No field on `CombatantState` records concentration. Damage application in `CombatantCard` does not check for concentration. There is no UI element showing a spell is active.
- Desired behavior: The DM can mark a combatant as concentrating on a named spell. When that combatant takes damage, the CON save DC is surfaced on the card (DM-visible only) and a "make a CON save" notification fires to both the DM and the affected player. The DM can end concentration manually or it clears automatically at 0 HP.
- Constraints: No DB persistence required — concentration state is in-memory only and resets between sessions. The DC display is non-blocking; the DM still asks the player to roll.
- Assumptions: The app is DM-operated in the current session. Player-facing views (if they come later) are out of scope for this change. The `effectiveDamage` value returned by `applyDamageWithType` is the correct basis for the DC (post-resistance).
- Edge cases considered:
  - Damage reduced to 0 by immunity → no save required (effectiveDamage = 0)
  - Multiple hits in the same turn → each hit is a separate save trigger
  - Setting a new concentration spell replaces the old one immediately
  - Healing does not trigger or clear concentration
  - Lair-type combatants cannot concentrate (not a spellcasting type in this app)

## Scope

### In Scope

- New optional fields on `CombatantState`: `concentratingOn?: string` and `pendingConSaveDC?: number`
- Helper `calcConSaveDC(effectiveDamage: number): number` in `lib/utils/combat.ts`
- Logic in `CombatantCard.tsx` to set `pendingConSaveDC` on damage if `concentratingOn` is set, and to clear `concentratingOn` when HP reaches 0
- Visual badge on `CombatantCard` showing the spell name when concentrating
- Inline DC prompt on the card when `pendingConSaveDC` is set (DM-only display), with a dismiss button
- "End Concentration" button in `CombatantDetailPanel.tsx`
- Text input in `CombatantDetailPanel.tsx` to set the concentrating spell name
- Notification to both DM and affected player via the existing notification/chat channel when a CON save is required
- Unit tests for `calcConSaveDC` and the auto-clear-on-0-HP logic
- Unit tests for the concentration badge and DC prompt rendering in `CombatantCard`

### Out of Scope

- Persisting concentration state to the database
- Player-facing combat views
- Automatic pass/fail determination (the DM still asks the player to roll)
- Tracking which round concentration started or how many rounds it has been active
- Linking concentration to a spell object from the spell collection

## What Changes

- `lib/types.ts`: Add `concentratingOn?: string` and `pendingConSaveDC?: number` to `CombatantState`
- `lib/utils/combat.ts`: Add `calcConSaveDC(effectiveDamage: number): number`
- `lib/components/CombatantCard.tsx`: Check concentration on damage, set DC field, auto-clear on 0 HP, render badge and DC prompt
- `lib/components/CombatantDetailPanel.tsx`: Add spell-name input and "End Concentration" button
- `tests/unit/components/CombatantCard.*.test.tsx`: New/updated tests covering concentration badge, DC prompt, and auto-clear
- `tests/unit/utils/combat.test.ts` (or equivalent): Tests for `calcConSaveDC`

## Risks

- Risk: `CombatantState` carries no `userId` — player ownership must be resolved indirectly.
  - Impact: Resolved. Player combatant IDs follow the pattern `character-${character.id}`. The `characters[]` array in `useCombat` / `ActiveCombatView` carries full `Character` objects with `userId`. The lookup is deterministic. The campaign chat system supports `{ scope: "direct"; toUserId: string }` messages. Notification is fully achievable via a new `onConSaveRequired` callback prop on `CombatantCard`, implemented by `ActiveCombatView`.
  - Mitigation: N/A — resolved.

- Risk: `pendingConSaveDC` persists on the card until dismissed. If the DM forgets to dismiss it, it could be confusing after the relevant save is resolved.
  - Impact: Low — cosmetic confusion only, no game-state impact.
  - Mitigation: Make the dismiss action obvious (× button); auto-clear on the next damage event to that combatant.

## Open Questions

- No unresolved ambiguity remains. All design decisions were settled during the exploration session and subsequent investigation:
  - Card-based DC display confirmed (not toast)
  - No persistence required
  - DC is DM-only; "make a CON save" prompt fires to DM + affected player
  - Player notification is achievable: combatant ID → character ID → userId lookup via `characters[]`; campaign direct-message channel already supports `{ scope: "direct"; toUserId }` visibility

## Non-Goals

- Automatic dice rolling for the CON save
- CON save advantage/disadvantage tracking
- Concentration duration tracking (rounds)
- Linking to a structured spell object
- Persisting concentration across sessions

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
