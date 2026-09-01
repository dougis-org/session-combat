## Context

`docs/campaign-encounter-rollout.md` partitions the 49 remaining campaigns into
5 groups. G1 (CoS, ToA, LMoP, ToD, BGDIA) shipped via PR #647. This change
covers G2 (WDH, SKT, OotA, DIP, PaBtSO) — the Sword Coast & Savage Frontier
cluster. Each campaign currently has placeholder encounters (`{ name, description, monsters: [] }`)
in `CAMPAIGN_CATALOG` and zero entries in `CUSTOM_MONSTERS` that are tagged with
their `source` field.

The Vecna pilot (PR #615) and G1 (PR #647) established the pattern:
- One per-campaign encounter helper (`xxEncounters()`) returning
  `EncounterTemplate[]` with full `Monster` stat blocks.
- One per-campaign contract test in `tests/unit/lib/scripts/seedCampaignTemplates.test.ts`
  verifying chapter count, encounter count, and unique instance ids.

## Goals / Non-Goals

**Goals:**
- Populate full encounter + monster data for the 5 G2 campaigns.
- Follow the existing `vecnaEncounters()` / `cosEncounters()` / `toaEncounters()`
  pattern verbatim — no new helpers, no new conventions.
- Preserve the canonical `DamageType` invariant already specified by
  `openspec/specs/campaign-monsters/spec.md`.
- Cover every campaign with at least one contract test (chapter count, full
  Monster blocks, unique instance ids).

**Non-Goals:**
- UI work on the encounters panel (#606, #607).
- Global Encounters Library feature (#578) — separate scope.
- Ingesting encounters into existing user campaigns — handled by
  `backfillCampaignEncounters.ts` (PR #591).
- G3 (Planar), G4 (Anthologies/APs), G5 (Classic/legacy/3PP) — separate
  changes per group.

## Decisions

- **One commit, one PR per group (not per campaign).** Matches G1 and the
  Vecna pilot precedent. Keeps the rollout predictable; per-campaign split
  would create 5x the PR review overhead with no quality benefit at this scale.
- **Campaign-specific antagonists inlined as `cm-` monsters** rather than
  referenced from the open5e adapter — the open5e SRD does not include
  campaign-exclusive NPCs like Manshoon, Jarlaxle's avatar, Iymrith, Maegera,
  Cryovain, or the Elder Brain Dragon.
- **SRD mirrors re-inlined under `cm-`** rather than referenced from the
  global SRD library — keeps the encounter self-contained per the rollout doc
  architecture. If the global SRD library is ever wiped, copied G2 campaigns
  remain playable.
- **`source: "<campaign title>"`** for every new `cm-` entry (matches Vecna
  and G1 — enables filtering and traceability).
- **No `as any` casts.** The Vecna fix removed all of them; this change must
  not reintroduce them.
- **No `eslint-disable` comments.** Same rationale.
- **`passive Perception` is a string** (e.g. `"12"`), per
  `docs/campaign-encounter-rollout.md` §"Constraints".
- **Unique per-instance `id`** on every `Monster` in every encounter — never
  reuse the same object reference. Use `toEncounterMonsters(template, n)` for
  repeated mobs.

## Risks / Trade-offs

- **[Risk]** A typo in a stat block (HP, AC, attack bonus) propagates to every
  copied campaign and is hard to correct retroactively.
  **Mitigation:** Per-campaign contract test asserts `monsters.length > 0` and
  each `Monster` has a non-zero `hp`, `ac`, and `challengeRating`. Manual
  cross-reference against the 5etools mirror for every CR ≥ 5 monster before
  commit.
- **[Risk]** Out-of-bounds references to monsters not yet defined (e.g. an
  encounter references `cm-iymrith` but the helper forgets to add it).
  **Mitigation:** Every helper passes through `findCustomMonsterById` — a
  missing monster throws at seed time, surfacing the gap during `npm test`.
- **[Risk]** File size growth on `customMonsters.ts` (now ~6,500 lines).
  **Mitigation:** Acceptable for this phase. A future refactor (out of scope
  here) can split per-campaign into separate files; the existing
  `findCustomMonsterById` API is stable so consumers won't break.
- **[Risk]** Existing campaigns in production DB still hold placeholder
  encounters.
  **Mitigation:** Out of scope here — `migrate:encounters` script (PR #591)
  handles retroactive ingest. The new `fix-campaign-template-seed` change
  (PR #609/#610, merged) provides a `--force` flag so the dev DB can be
  resynced with `npm run seed -- --force` once this PR lands.

## Migration Plan

1. Merge this PR to `main`.
2. Run `npm run seed -- --force` against the dev DB to upsert the G2 catalog
   with the new encounters (existing campaigns keep their user data; only the
   template-level `encounters` array is overwritten).
3. Run `npx tsx lib/scripts/backfillCampaignEncounters.ts` against production
   to ingest the new encounters into already-copied user campaigns (one-shot
   migration; idempotent).
4. No rollback strategy needed — the schema is additive (only adds to
   `CUSTOM_MONSTERS` and fills in already-existing `encounters` arrays). A bad
   release can be reverted by reverting the commit.

## Open Questions

None at this time.
