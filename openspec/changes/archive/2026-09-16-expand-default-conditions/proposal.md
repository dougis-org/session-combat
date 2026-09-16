## GitHub Issues

- dougis-org/session-combat#742

## Why

- Problem statement: The default condition catalog (`lib/data/conditionCatalog.ts`) ships the 15 official 5e SRD conditions, but combatants can be affected by named status effects from common spells (e.g. *Slow*, *Confusion*) and features (Turn Undead) that aren't in that list. Users currently have to add these as ad hoc custom conditions with no standard description.
- Why now: Reported directly by the project owner in #742 after noticing Slowed was missing while running a session.
- Business/user impact: DMs/players lose the quick-pick convenience and standardized SRD-style wording for these conditions; low severity (workaround exists via custom conditions) but a recurring annoyance in active play.

## Problem Space

- Current behavior: `CONDITION_CATALOG` contains exactly the 15 official PHB/SRD conditions (Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious). `lib/scripts/seedConditionCatalog.ts` upserts these by `name` into the `conditionCatalog` Mongo collection; `lib/storage/conditionCatalogRepo.ts` and `app/api/conditions/catalog/route.ts` expose them read-only; `ConditionFormModal`/`ConditionControls` surface them as quick-pick options on combatant cards.
- Desired behavior: The catalog additionally includes named status effects commonly inflicted by spells/features that aren't part of the official 15 but are frequently needed at the table: **Slowed** (*Slow* spell), **Confused** (*Confusion* spell), **Turned** (Turn Undead-type effects).
- Constraints: Catalog entries are freeform `{name, description}` data only — no mechanical automation (advantage/disadvantage, speed changes, etc.) is applied anywhere in the codebase for any condition, including the existing 15. This change follows that same pattern; it does not add mechanical enforcement for the new conditions.
- Assumptions: "Investigate spell effects" (per the issue) means a domain-knowledge/SRD pass, not a repository search — this project has no local spell dataset; spells are fetched live from the open5e API per campaign and stored only as free-text descriptions (`lib/import/transformSpell.ts`), so there is nothing in-repo to grep for condition keywords.
- Edge cases considered:
  - Existing persisted `conditionCatalog` documents for the 15 current conditions must be unaffected (upsert-by-`name` in the seed script already guarantees this — no code change needed there).
  - Tests that assert the catalog's exact length (currently 15) will need updating to 18.
  - New entries must not collide by `name` with any existing catalog entry or common custom-condition names already in use (checked: no collision).

## Scope

### In Scope

- Add three entries to `CONDITION_CATALOG` in `lib/data/conditionCatalog.ts`: Slowed, Confused, Turned, each with an SRD-style `name` + `description`.
- Update the doc comment on `CONDITION_CATALOG` (currently "The 15 standard D&D 5e conditions...") to reflect the new count/composition.
- Update any test that asserts the catalog's exact contents/length (e.g. `tests/unit/lib/storage/conditionCatalogRepo.test.ts`, and any test under `tests/unit/lib/data/` or `tests/unit/scripts/` covering `CONDITION_CATALOG`/`seedConditionCatalog`).
- Re-running `seedConditionCatalog` against each environment's database after merge (ops step, tracked in tasks — not a code change since the script already upserts by name).

### Out of Scope

- Any mechanical automation for conditions (advantage/disadvantage, speed reduction, forced movement, etc.) — none exists today for any condition and none is being added.
- Polymorphed and Banished (considered and explicitly rejected — see Non-Goals).
- Building tooling to scan open5e spell text programmatically for condition keywords.
- Changes to `ConditionFormModal`, `ConditionControls`, or the catalog API contract — the new entries flow through existing UI/API code paths unchanged.

## What Changes

- `lib/data/conditionCatalog.ts`: add Slowed, Confused, Turned entries; update doc comment.
- Test files asserting catalog length/contents: update expected count from 15 to 18 and/or add coverage for the new entries.
- Deployed databases: re-run `seedConditionCatalog` post-merge in each environment (dev/staging/prod) to upsert the new entries — no schema change, existing upsert-by-name logic handles this.

## Risks

- Risk: Test breakage from hardcoded assumptions about "15 conditions".
  - Impact: CI failure until tests are updated; low severity, caught immediately.
  - Mitigation: Explicitly enumerated in Scope/Tasks; grep for `CONDITION_CATALOG.length`/`.length).toBe(15)`-style assertions during implementation.
- Risk: Forgetting to re-run the seed script in a deployed environment leaves that environment's `conditionCatalog` collection stale (missing the 3 new entries) even though the code ships.
  - Impact: New conditions won't appear as quick-picks in that environment until seeded.
  - Mitigation: Tracked as an explicit task; seeding is idempotent (upsert by name) so it's safe to re-run.
- Risk: Scope creep — pressure to also add Polymorphed/Banished/other spell effects "while we're in there".
  - Impact: Expands review surface and reopens the mechanically-heavier debate this proposal deliberately closes.
  - Mitigation: Explicitly called out in Non-Goals with rationale; any future addition should be a separate issue/change.

## Open Questions

None — scope, exact 3 conditions, and their descriptions were aligned with the requester (project owner) in prior discussion before this proposal was drafted.

## Non-Goals

- Adding Polymorphed: excluded because it fundamentally replaces the creature's stat block/HP rather than decorating it with a status tag, which doesn't fit this freeform name+description catalog model.
- Adding Banished: excluded because a banished creature is typically removed from the active encounter for the spell's duration, making a combatant-card status badge a poor fit.
- Adding mechanical automation for any condition (existing 15 or new 3): out of scope for this catalog, which is presentation-only.
- Building a general "scan spells for missing conditions" feature/script: this was done manually via SRD knowledge for this change; not being productized.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
