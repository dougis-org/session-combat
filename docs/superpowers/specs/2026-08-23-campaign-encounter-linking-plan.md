# Campaign-Aware Combat Start — Implementation Plan

Companion to [`2026-08-23-campaign-encounter-linking-design.md`](./2026-08-23-campaign-encounter-linking-design.md).
This lists the GitHub issues tracking the work, in dependency/suggested
implementation order. No code is implemented as part of this planning
change — issues are created in `dougis-org/session-combat` for later work.

## Order

1. **[#535 — Add `encounterIds` to the Campaign model](https://github.com/dougis-org/session-combat/issues/535)**
   — `lib/types.ts`, `normalizeCampaign()` default in `lib/storage.ts`.
   Foundation for everything else; nothing downstream can be built
   until the field exists and old campaign docs normalize safely.
2. **[#536 — Campaign↔Encounter link API](https://github.com/dougis-org/session-combat/issues/536)**
   — `GET/POST /api/campaigns/[id]/encounters`,
   `DELETE /api/campaigns/[id]/encounters/[encounterId]`, plus optional
   `campaignId` on `POST /api/encounters`. Depends on #535. This is the
   single API surface every UI piece below reads/writes through.
3. **[#537 — Campaign encounters management screen](https://github.com/dougis-org/session-combat/issues/537)**
   — new `app/campaigns/[id]/encounters/page.tsx` (link existing /
   create new / unlink), reusing `EncounterEditor`. Depends on #536 —
   needs the link API to exist. **Done** (PR #553) — also folded in
   #540's nav-tab sub-scope (Encounters + Combat tabs on
   `app/campaigns/[id]/layout.tsx`), so a future #540 pass only needs
   the campaign-list "Start Encounter" button split.
4. **[#538 — Scope the campaign combat-setup encounter picker](https://github.com/dougis-org/session-combat/issues/538)**
   — `useCombat`/`CombatSetupView` fetch campaign-scoped encounters when
   `campaignId` is present; empty-state messaging. Depends on #536 only;
   can be built in parallel with #537.
5. **[#539 — Ad hoc combat page: in-progress campaign banner](https://github.com/dougis-org/session-combat/issues/539)**
   — `app/combat/page.tsx` dismissible banner reading `campaign.status`.
   Depends on #535 only; independent of #536-#538, can be built in
   parallel.
6. **[#540 — Wire up campaign nav + fix mislabeled "Start Encounter" button](https://github.com/dougis-org/session-combat/issues/540)**
   — `app/campaigns/[id]/layout.tsx` tabs, `app/campaigns/page.tsx`
   button split into "Encounters" + "Start Combat". Depends on #537 so
   the new Encounters tab has somewhere to point; do this last among
   the UI work so both destination pages already exist. **Partially
   done**: the nav-tab addition was absorbed into #537 (PR #553).
   Remaining scope is only the campaign-list button split on
   `app/campaigns/page.tsx`.
7. **[#541 — Tests: campaign-encounter linking + campaign-aware combat start](https://github.com/dougis-org/session-combat/issues/541)**
   — API route tests for #536, E2E coverage for the full
   campaign → encounters → start combat flow and the ad hoc banner.
   Depends on #536-#540 being complete.

Suggested parallelization: after (1) and (2) land, (3), (4), and (5) can
proceed concurrently; (6) and (7) close out the change once their
dependencies are in.

## Issue Tracker

Issues #535–#541 are filed in `dougis-org/session-combat`, each linking
back to the design spec above. See the repo issue tracker for current
status — this file records the intended breakdown and order, not live
state.
