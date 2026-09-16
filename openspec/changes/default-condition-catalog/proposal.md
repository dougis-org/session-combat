## GitHub Issues

- #733

## Why

- Problem statement: Applying a condition to a combatant is free-form text today. The DM has to already know (or look up) what a condition mechanically does, and other players/DMs looking at the board have no way to see the effect without asking.
- Why now: Issue #733 was filed asking for a selectable list of conditions with their descriptions shown at the table, to remove that lookup friction during live play.
- Business/user impact: Faster, lower-friction condition tracking during combat; fewer mid-session context switches to a rulebook or SRD website; more consistent condition naming across a table (no "Prone" vs "prone" vs "knocked down" variants).

## Problem Space

- Current behavior:
  - `ConditionFormModal` (`lib/components/combatant-card/ConditionFormModal.tsx`) is a free-text name + optional numeric duration form. `StatusCondition.description` (`lib/types.ts:522`) exists on the type but is always written as `''` — nothing currently populates or displays it.
  - `ConditionControls` (`lib/components/combatant-card/ConditionControls.tsx`) renders an expandable "Conditions (N)" toggle on the combatant card; each expanded row shows only `name` and, if present, `(N rounds)`.
  - `CombatInfoIcon` (`lib/components/CombatInfoIcon.tsx`) separately lists each combatant's conditions (name + duration only) in a hover tooltip. This proposal does not touch that tooltip.
  - There is no canonical list of D&D 5e conditions anywhere in the codebase. Monster `conditionImmunities` (`lib/validation/monsterUploadSchema.ts`) is a free-form `string[]`, unrelated to this change.
- Desired behavior:
  - A DM can pick a condition from a dropdown of standard D&D 5e conditions (Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious) with each option's rules-text description pulled automatically.
  - A "Custom…" option remains for homebrew/DM-defined conditions, using today's free-text name entry (description stays blank/editable-free-text for those).
  - The existing collapsed "Conditions (N)" list gains an inline description line under each condition's name/duration — no new hover tooltip, no separate badge/chiclet component.
- Constraints:
  - The catalog must live in MongoDB (a new, small collection), not a hardcoded TS constant, so it can be corrected/extended without a code deploy.
  - Must not regress the existing "Custom" free-text path (name length/duration validation rules in `parseConditionForm` stay as-is for that path).
  - Per project convention, catalog data read into a combat UI is untrusted-adjacent (DB-sourced) and must be sanitized/validated the same way other Mongo-backed lookups are (bounded lengths, no unexpected fields) before rendering.
- Assumptions:
  - One global, shared catalog (not per-user, not per-campaign) is sufficient — the 15 standard conditions apply to every table.
  - The catalog is seeded once (via a seed script, similar to `lib/scripts/seedCampaignTemplates.ts`) rather than authored through a UI in this change.
  - No admin UI to edit the catalog is in scope for this change (see Non-Goals).
- Edge cases considered:
  - Combatant already has a condition applied whose name no longer matches a catalog entry (e.g., catalog entry renamed/removed after being applied): the previously-stored `name`/`description` on the `StatusCondition` must keep rendering as-is; lookups only affect the picker, not already-applied conditions.
  - Catalog fetch fails or is empty (network hiccup, collection not yet seeded): dropdown must still let the DM add a "Custom" condition — the feature must not lock out condition tracking.
  - Duplicate condition names between catalog and a custom-entered one: no dedup/merge logic needed; they're independent entries once applied to a combatant.

## Scope

### In Scope

- New MongoDB collection storing the default condition catalog (name + description; standard 5e list).
- Seed script/data to populate the catalog with the 15 standard conditions and their SRD descriptions.
- Read API/route to fetch the catalog for use by the condition picker.
- Replace the free-text name input in `ConditionFormModal` with a dropdown of catalog conditions plus a "Custom…" option that reveals the existing free-text input.
- Populate `StatusCondition.description` from the selected catalog entry when a non-custom condition is chosen.
- Update `ConditionControls`'s expanded "Conditions (N)" list to render each condition's description inline.

### Out of Scope

- Any change to `CombatInfoIcon`'s hover tooltip (out of scope per explicit decision — no popup work there).
- A chiclet/badge UI element for conditions (explicitly rejected in favor of the existing collapse/expand list).
- Admin UI for editing/adding catalog entries after seeding.
- Automatic mechanical enforcement of a condition's effects (e.g., auto-imposing disadvantage on attack rolls for Poisoned) — this change is descriptive/informational only.
- Per-campaign or per-user custom catalogs.
- Changes to monster `conditionImmunities` validation or data shape.

## What Changes

- New Mongo collection (e.g. `conditionCatalog`) + seed data for the 15 standard 5e conditions.
- New read-only fetch path (API route or existing storage-layer read) to load the catalog into the client.
- `ConditionFormModal`: dropdown-of-catalog-conditions + "Custom…" free-text fallback, replacing the always-free-text name input.
- `StatusCondition` instances created from a catalog pick carry the catalog's `description`; custom ones keep `description: ''` as today.
- `ConditionControls`: expanded list rows show the description text alongside name/duration.

## Risks

- Risk: Hardcoding "MongoDB collection" without confirming project storage conventions (repos vs. direct `storage.*` calls) could misalign with the recent storage-refactor work (`Storage #504` migrated several domains to per-domain repos).
  - Impact: Design/implementation could pick an inconsistent persistence pattern, adding rework.
  - Mitigation: `design.md` will map this to whatever pattern the current `lib/db`/repo layer uses for other small reference/lookup collections before writing code.
- Risk: Seeding is a one-time script; if it's never run in an environment (e.g., a fresh dev DB), the dropdown silently has no catalog options.
  - Impact: Degrades to "Custom only," which is a safe but confusing fallback if unexpected.
  - Mitigation: Empty-catalog UI state should say so explicitly (e.g., "No default conditions loaded — add a custom one") rather than showing a blank dropdown; document the seed step in the change's tasks.
- Risk: Growing the "Conditions (N)" expanded rows with description text increases card vertical height, which could push against the card layout on smaller screens.
  - Impact: Minor layout/readability regression on a crowded combat tracker with many multi-condition combatants.
  - Mitigation: Keep description text small/muted and only render it when a description string is non-empty (custom conditions with no description add no extra line).

## Open Questions

- Question: Should the "Custom…" path let a DM optionally type a free-text description too, or stay description-less as today?
  - Needed from: Doug (project owner)
  - Blocker for apply: no — default to description-less custom entries (current behavior) unless told otherwise; easy to add a description field later without a breaking change.
- Question: Exact collection name and whether it belongs under an existing "reference data" naming convention in the DB (if one exists)?
  - Needed from: codebase investigation during design.md, confirm naming with Doug only if no existing convention is found
  - Blocker for apply: no — design.md will settle this by inspecting existing collections before implementation.

## Non-Goals

- Mechanically enforcing condition effects on rolls/actions.
- An admin/editor UI for the catalog.
- Touching `CombatInfoIcon`'s tooltip or introducing a chiclet/badge component.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
