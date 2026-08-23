# Campaign-Aware Combat Start — Implementation Plan

Companion to [`2026-08-23-campaign-encounter-linking-design.md`](./2026-08-23-campaign-encounter-linking-design.md).
This lists the GitHub issues tracking the work, in dependency/suggested
implementation order. No code is implemented as part of this planning
change — issues are created in `dougis-org/session-combat` for later work.

## Order

1. **Add `encounterIds` to the Campaign model** — `lib/types.ts`,
   `normalizeCampaign()` default in `lib/storage.ts`. Foundation for
   everything else; nothing downstream can be built until the field
   exists and old campaign docs normalize safely.
2. **Campaign↔Encounter link API** — `GET/POST /api/campaigns/[id]/encounters`,
   `DELETE /api/campaigns/[id]/encounters/[encounterId]`, plus optional
   `campaignId` on `POST /api/encounters`. Depends on (1). This is the
   single API surface every UI piece below reads/writes through.
3. **Campaign encounters management screen** — new
   `app/campaigns/[id]/encounters/page.tsx` (link existing / create new /
   unlink), reusing `EncounterEditor`. Depends on (2) — needs the link
   API to exist.
4. **Scope the campaign combat-setup encounter picker** —
   `useCombat`/`CombatSetupView` fetch campaign-scoped encounters when
   `campaignId` is present; empty-state messaging. Depends on (2) only;
   can be built in parallel with (3).
5. **Ad hoc combat page: in-progress campaign banner** —
   `app/combat/page.tsx` dismissible banner reading `campaign.status`.
   Depends on (1) only; independent of (2)-(4), can be built in
   parallel.
6. **Wire up campaign nav + fix campaigns-list button** —
   `app/campaigns/[id]/layout.tsx` tabs, `app/campaigns/page.tsx` button
   split into "Encounters" + "Start Combat". Depends on (3) so the new
   Encounters tab has somewhere to point; do this last among the UI
   work so both destination pages already exist.
7. **Tests** — API route tests for (2), E2E coverage for the full
   campaign → encounters → start combat flow and the ad hoc banner.
   Depends on (2)-(6) being complete.

Suggested parallelization: after (1) and (2) land, (3), (4), and (5) can
proceed concurrently; (6) and (7) close out the change once their
dependencies are in.

## Issue Tracker

Issues are filed in `dougis-org/session-combat`, each linking back to
the design spec above. See the repo issue tracker for current status —
this file records the intended breakdown and order, not live state.
