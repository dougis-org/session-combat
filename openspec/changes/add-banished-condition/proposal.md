## GitHub Issues

- dougis-org/session-combat#813

## Why

- Problem statement: The default condition catalog (`lib/data/conditionCatalog.ts`) has no **Banished** entry (5e *Banishment* spell). A banished creature leaves the encounter for the spell's duration, but today a DM can only fake it with a custom tag while the combatant still takes initiative turns and stays targetable.
- Why now: Requested in #813. The earlier `expand-default-conditions` change (#742) excluded Banished because a status badge alone "fits poorly"; this change addresses that gap by giving the condition real removed-from-play behavior instead of a cosmetic tag.
- Business/user impact: DMs running *Banishment* (or similar plane-shift effects) no longer have to manually skip the combatant each round or remember not to target it. Medium convenience; no data-safety impact.

## Problem Space

- Current behavior:
  - `CONDITION_CATALOG` has 18 name+description entries; `StatusConditionCatalogEntry` is `{name, description}` and `StatusCondition` is `{id, name, description, duration?}` (`lib/types.ts`). No condition has any mechanical effect.
  - `nextTurn` (`lib/hooks/useCombat.ts`) skips only `type === 'monster' && hp <= 0`.
  - The initiative modal (`lib/hooks/useInitiativeModal.ts`), `rollUnrolledMonsters`, and `unrolledMonsterCount` (`ActiveCombatView.tsx`) treat any combatant without `initiativeRoll` as unrolled.
  - `TargetingPanel` builds party/enemy target lists from `allCombatants.filter(...)` with no condition awareness; `combatant.targetIds` may retain ids of combatants later removed from play.
  - `lifeStateDisplay` (`lib/combat/deathSaves.ts`) is the single source of the card's `greyed` decision.
  - Conditions are added in `ConditionFormModal` (catalog pick copies `description`) and removed in `ConditionControls`. A second add path exists: `TargetActionModal` "Add Condition" collects a freeform name/duration and `TargetingPanel.addConditionToTarget` builds a `StatusCondition` with an empty description and no catalog lookup; timed conditions are also removed by `processRoundEnd` (`lib/combat/conditionExpiry.ts`).
- Desired behavior:
  - A **Banished** catalog entry carrying a `removedFromPlay: true` flag.
  - Adding it from the catalog puts that flag on the resulting `StatusCondition`; removing the condition (manually or by duration expiry) clears it, because the combatant's removed-from-play state is derived from its current conditions.
  - A removed-from-play combatant is skipped by `nextTurn`, excluded from unrolled-initiative prompts and counts, absent from the target-selection lists, and rendered greyed on its card.
- Constraints:
  - Optional field only: existing catalog documents, saved combats, and conditions without the flag must behave exactly as before.
  - Catalog API stays an explicit field projection (decision: project catalog responses to public fields), so the new field must be added to the projection deliberately.
  - Skip logic must remain a bounded single lap (decision: bound initiative advancement to one complete lap).
  - Banished state must not rely on condition-name matching, so a hand-typed custom "Banished" does not silently change turn order.
- Assumptions:
  - "Flag set when the condition is added / removed when it is removed" is satisfied by deriving `isRemovedFromPlay(combatant)` from `combatant.conditions` rather than storing a second combatant-level boolean that could drift (e.g. on duration expiry). See Open Questions.
  - Players can be banished too; the skip applies to any combatant type.
  - Damage applied directly on a banished combatant's own card is not blocked.
- Edge cases considered:
  - All remaining combatants banished/downed: `nextTurn` already alerts "No combatants remain able to take a turn."
  - The active combatant becomes banished mid-turn: next `nextTurn` advances normally; the current turn is not forcibly ended.
  - Banished combatant with no `initiativeRoll`: must not trigger the auto-open initiative modal or count toward "Roll d20 for all N unrolled Monsters".
  - Banished combatant already in another combatant's `targetIds`: chip is hidden, not pruned (see design).
  - Timed Banished (`duration`) expires at round wrap: condition removed, so the combatant re-enters play on its next initiative slot.
  - Legendary-action pool reset (`resetIncomingLegendaryPool`) must not run for a skipped combatant.

## Scope

### In Scope

- Add `removedFromPlay?: boolean` to `StatusConditionCatalogEntry` and `StatusCondition` (`lib/types.ts`).
- Add the **Banished** entry (with `removedFromPlay: true` and SRD-style *Banishment* description) to `CONDITION_CATALOG`; update the doc comment and catalog-count tests (18 -> 19).
- Carry the flag through: seed script (already `$set`s the whole entry), `loadConditionCatalog` projection, `/api/conditions/catalog` response, `ConditionFormModal` catalog selection -> `StatusCondition`.
- New `isRemovedFromPlay(combatant)` helper (single source of truth) in `lib/combat/`.
- `nextTurn` skips removed-from-play combatants (any type), alongside the existing downed-monster skip.
- Exclude removed-from-play combatants from unrolled-initiative detection: `useInitiativeModal`, `rollUnrolledMonsters`, `unrolledMonsterCount`.
- Hide removed-from-play combatants from `TargetingPanel` party/enemy lists and handle stale `targetIds`.
- Route the target-add path through the catalog: `TargetActionModal`'s "Add Condition" opens the existing `ConditionFormModal` for the target (catalog dropdown + custom + duration), replacing the freeform name input and `addConditionToTarget`, so Banished applied to a target gets its flag and description.
- Grey the combatant card and show a "Banished" indicator (extend `lifeStateDisplay` or a sibling helper so greying stays in one place).
- Re-run `seedConditionCatalog` in each environment after merge (ops step).

### Out of Scope

- Any other mechanical automation of conditions (advantage/disadvantage, speed, etc.).
- Blocking direct HP edits on a banished combatant's card.
- Other removed-from-play effects (e.g. Plane Shift variants) beyond adding the one catalog entry; the flag makes them trivial to add later.
- Adding the Polymorphed condition (still excluded per #742).

## What Changes

- `lib/types.ts`: optional `removedFromPlay` on `StatusConditionCatalogEntry` and `StatusCondition`.
- `lib/data/conditionCatalog.ts`: Banished entry; doc comment.
- `lib/storage/conditionCatalogRepo.ts`: projection includes `removedFromPlay` when set.
- `lib/components/combatant-card/ConditionFormModal.tsx`: copy `removedFromPlay` from the selected catalog entry.
- New `lib/combat/removedFromPlay.ts`: `isRemovedFromPlay` helper.
- `lib/hooks/useCombat.ts`: `nextTurn` skip, `rollUnrolledMonsters` exclusion.
- `lib/hooks/useInitiativeModal.ts`, `lib/components/ActiveCombatView.tsx`: unrolled detection/count exclusion.
- `lib/components/combatant-card/TargetingPanel.tsx`: target-list filter and stale-target handling; render `ConditionFormModal` for the selected target and drop `addConditionToTarget`.
- `lib/components/TargetActionModal.tsx`: "Add Condition" requests the shared condition modal instead of collecting a freeform name (remove its condition mode).
- `lib/combat/deathSaves.ts` / card header: greying and Banished badge.
- Tests: catalog/seed count, repo projection, modal flag copy, helper, `nextTurn`, unrolled exclusion, targeting filter, card greying.
- Deployed DBs: re-run `seedConditionCatalog` post-merge (idempotent upsert by name).

## Risks

- Risk: Condition expiry or removal leaves a stale skip.
  - Impact: A returned combatant is still skipped.
  - Mitigation: Derive state from `conditions` on every check; no stored combatant-level flag.
- Risk: Every code path that enumerates "active" combatants must honor the helper; a missed path (e.g. a future initiative list) still shows or targets banished combatants.
  - Impact: Inconsistent UI.
  - Mitigation: Single helper; tasks enumerate each current call site; tests per site.
- Risk: Environments not re-seeded lack the Banished entry (and flag).
  - Impact: Banished absent from the dropdown there.
  - Mitigation: Explicit ops task; seed is idempotent.
- Risk: Skipping unrolled banished combatants then un-banishing leaves them unrolled.
  - Impact: Initiative modal prompts for them once they return, which is the desired behavior.
  - Mitigation: Documented in specs.
- Risk: Replacing the target modal's freeform condition input changes an existing flow.
  - Impact: Tests and muscle memory for the old inline form break; the shared modal needs the target's name as heading.
  - Mitigation: Reuse `ConditionFormModal` unchanged (it already takes `combatantName`); update `TargetActionModal` tests.
- Risk: Reversing the #742 Non-Goal reopens the scope debate.
  - Impact: Review friction.
  - Mitigation: Scope above is explicit; Polymorphed remains excluded.

## Open Questions

- Question: Is deriving "removed from play" from the condition's `removedFromPlay` flag (no separate combatant-level boolean) acceptable for "flag set on add, cleared on removal"?
  - Needed from: Requester
  - Blocker for apply: no (design proceeds with derivation; a stored combatant flag would only add drift risk)
- Resolved: the target-add path is in scope (requester decision); it reuses `ConditionFormModal` so there is one condition-entry UI. Side effect: conditions added to targets now also get catalog descriptions.

## Non-Goals

- Mechanical automation beyond the removed-from-play behavior described above.
- Blocking HP edits, healing, or death saves on a banished combatant.
- Name-based matching of custom conditions.
- Redesigning `ConditionFormModal` itself; it is reused as-is.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
