## GitHub Issues

- #93

## Why

- Problem statement: D&D 5e spells that require concentration need to be tracked during combat. When a concentrating creature takes damage, they must make a Constitution saving throw (DC 10 or half damage taken, whichever is higher) or lose the spell. Currently, there's no mechanism to track this.
- Why now: DM manually tracks concentration using paper notes or external tools. This is error-prone during intense combat.
- Business/user impact: Reduces cognitive load for DMs, prevents forgotten concentration checks, provides auto-calculated DC reminders.

## Problem Space

- Current behavior: No concentration tracking exists. DMs must remember which combatants are concentrating, manually track when damage occurs, and calculate the DC themselves.
- Desired behavior: Combatants can be marked as concentrating on a named spell. When damage is dealt to a concentrator, the DC is automatically calculated and displayed. Concentration clears on 0 HP or manually via button.
- Constraints: DC calculation must follow D&D 5e rules (DC = max(10, floor(damage/2))). The DM still asks the player to roll the actual save — this is a reminder/calculator only, not a roller.
- Assumptions: Spell names will be stored as free-form text. Spell validation is out of scope (DM can enter any text). Spell list population will be addressed by issue #146.
- Edge cases considered: Combatant at 0 HP with temp HP still standing — only true 0 HP (not temp HP cushion) triggers auto-clear. Multiple damage sources same turn — DC badge updates per-instance. Non-blocking UX — no alert() or confirm() dialogs that halt flow.

## Scope

### In Scope

- Add `concentrationSpell?: string` field to `CombatantState`
- Concentration indicator in combatant row (icon + spell name)
- End Concentration button with toast notification
- DC badge on damage to concentrator (non-blocking reminder)
- Auto-clear concentration when HP reaches 0 (with toast)
- DC badge clears when turn advances
- Concentration field in combatant detail popup

### Out of Scope

- Actual CON save roll (DM handles this outside app)
- Concentration tracking toggle at combat level (always available if combatant has spell)
- Spell validation or spell list management (deferred to #146)
- HP history integration (concentration saves are separate from HP changes)

## What Changes

- `lib/types.ts`: Add `concentrationSpell?: string` to `CombatantState`
- `app/combat/page.tsx`: Add concentration UI to `CombatantCard`, DC badge logic in `adjustHp()`, turn advance clears DC badge
- Toast notifications for manual end and auto-clear on 0 HP

## Risks

- Risk: DC badge appears on every damage event, could clutter UI if many combatants are concentrating
  - Impact: Visual noise during combat
  - Mitigation: Badge is compact (single line) and clears automatically on turn advance
- Risk: Spell name is free-form text with no validation
  - Impact: DM could misspell spell names, making concentration unclear
  - Mitigation: Future spell list from #146 will provide autocomplete; free-text still works as fallback

## Open Questions

- Question: Should the concentration field in detail popup be visible always, or only when clicked/focused?
  - Needed from: Decision (leaning toward always visible for discoverability)
  - Blocker for apply: no

## Non-Goals

- Automating the actual CON save roll
- Combat-level concentration tracking toggle
- Spell validation or spell list management (handled in #146)
- Tracking concentration in HP history

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.