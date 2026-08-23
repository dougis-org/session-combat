# Campaign-Aware Combat Start — Design Spec

Status: Approved for issue breakdown (2026-08-23). No implementation in this change — see the companion plan doc for the GitHub issue breakdown.

## Context

The campaigns list page has a "Start Encounter" button that is mislabeled
and misdirected: it links to `/encounters` (the global encounter browser),
not to combat. Separately, a proper campaign-scoped combat page already
exists at `app/campaigns/[id]/combat/page.tsx` (renders `CombatSetupView`
via `useCombat({ campaignId })`) but it is **orphaned** — nothing in the UI
links to it. A global, campaign-agnostic ad hoc combat builder already
exists and works at `app/combat/page.tsx`, linked from the main `NavBar`.

The deeper gap: `Encounter` records have no relationship to `Campaign` at
all. `CombatSetupView`'s "From Library" picker always fetches and shows
*every* encounter the user owns (`GET /api/encounters`, no filter, no
pagination), regardless of which campaign combat was started from. As a
DM accumulates encounters across campaigns, this list becomes unusable —
they must scroll past every other campaign's encounters to find the one
they want.

This design fixes the mislabeled button, wires up the orphaned campaign
combat page, and introduces a many-to-many Campaign↔Encounter link so
that starting combat from a campaign only surfaces that campaign's
encounters, while the ad hoc builder (which never requires a campaign)
continues to work exactly as it does today, gaining only a soft nudge
when the DM has an active campaign they might mean to use instead.

## Decisions

1. **Linking model**: many-to-many via `Campaign.encounterIds: string[]`.
   No reverse field on `Encounter`, no join collection — arrays are
   idiomatic for the existing Mongo-native-driver storage layer.
   Precedent: `Party.campaignId` already exists as a single-FK pattern;
   this is intentionally different (array, many-to-many) since encounters
   must be reusable across campaigns.
2. **Start Combat picker scope**: when launched from a campaign, the
   "From Library" panel shows only that campaign's linked encounters.
   "Quick Entry" (ad hoc combatants) remains fully available and
   unfiltered — combat never requires a campaign.
3. **Retroactive linking**: in scope now — DMs need a way to link
   pre-existing/unlinked encounters to a campaign, since campaigns will
   commonly reuse older encounters.
4. **Unlinked encounters**: stay invisible to any campaign-scoped picker;
   remain reachable via the global `/encounters` browser and the ad hoc
   builder, exactly as today.
5. **In-progress campaign awareness on the ad hoc page**: a dismissible
   banner on `/combat` ("You have an in-progress campaign: {name}")
   linking to that campaign's `/campaigns/[id]/combat`. No inline
   campaign selector, no forced redirect — ad hoc stays the default,
   untouched flow.
6. **"In-progress" signal**: `campaign.status === 'active'`.

## Data Model

`lib/types.ts` — extend `Campaign`:

```ts
export interface Campaign {
  // ...existing fields...
  encounterIds?: string[]; // many-to-many link to Encounter.id
}
```

`normalizeCampaign()` in `lib/storage.ts` gets a default:

```ts
encounterIds: Array.isArray(campaign.encounterIds) ? campaign.encounterIds : [],
```

No change to the `Encounter` type.

## API Surface (new)

- `GET /api/campaigns/[id]/encounters` — resolve `campaign.encounterIds`
  to full `Encounter[]` (query `encounters` collection with
  `id: { $in: encounterIds }, userId`). This is what the campaign-scoped
  `CombatSetupView` and the new encounters-management screen both call.
- `POST /api/campaigns/[id]/encounters` — body `{ encounterId }`;
  `$addToSet` onto `campaign.encounterIds` after verifying the encounter
  belongs to `auth.userId`.
- `DELETE /api/campaigns/[id]/encounters/[encounterId]` — `$pull` from
  `campaign.encounterIds`. Never deletes the underlying `Encounter`.
- `POST /api/encounters` — accept an optional `campaignId` in the body;
  when present, create the encounter then link it (same as calling the
  POST above) in one round trip, for "create new encounter from within a
  campaign" convenience.

Follow the existing route conventions in `app/api/parties/route.ts` and
`app/api/campaigns/[id]/route.ts` (`withAuth`, ownership checks via
`storage`, `NextResponse.json`).

## UI Changes

1. **`app/campaigns/page.tsx`** (campaign list card, ~line 275): replace
   the single mislabeled `Link href="/encounters">Start Encounter</Link>`
   with two actions:
   - **"Encounters"** → `/campaigns/${campaign.id}/encounters` (new)
   - **"Start Combat"** → `/campaigns/${campaign.id}/combat` (existing,
     currently-orphaned page)

2. **`app/campaigns/[id]/layout.tsx`** nav array (line ~40): add
   `{ label: 'Encounters', href: '/campaigns/${id}/encounters' }` and
   `{ label: 'Combat', href: '/campaigns/${id}/combat' }` alongside the
   existing Members/Sessions/Prompts/Library tabs.

3. **New `app/campaigns/[id]/encounters/page.tsx`** — campaign encounter
   management:
   - Lists currently-linked encounters (`GET /api/campaigns/[id]/encounters`)
   - "Link Existing Encounter" — searchable picker over
     `GET /api/encounters` (all owned encounters), excludes already-linked
     ones, calls the link POST
   - "Create New Encounter" — reuse `app/encounters/EncounterEditor.tsx`,
     passing `campaignId` so the save auto-links
   - "Unlink" per row (confirm before removing; does not delete the
     Encounter record — deletion stays the global `/encounters` screen's
     job)

4. **`lib/components/CombatSetupView.tsx` + `lib/hooks/useCombat.ts`** —
   `useCombat({ campaignId })` currently always does
   `fetch('/api/encounters')` unconditionally. When `campaignId` is set,
   fetch `/api/campaigns/${campaignId}/encounters` instead. Add an empty
   state to the "From Library" panel when the resolved list is empty:
   message + link to the campaign's new Encounters tab. "Quick Entry" is
   unaffected.

5. **`app/combat/page.tsx`** (ad hoc/global) — add a dismissible banner:
   fetch the user's campaigns, find one with `status === 'active'`
   (if exactly one; if multiple, list them or pick the most recently
   updated — an implementation detail for that issue), show "You have an
   in-progress campaign: {name}" with a link to
   `/campaigns/${id}/combat`. Dismiss state can be session-local (no
   need to persist).

## Out of Scope

- Bidirectional reverse lookup ("which campaigns use this encounter")
  from the global `/encounters` screen.
- Pagination/filtering on the global encounters list — campaign scoping
  solves the DM's actual pain point without this.
- Any change to `ActiveCombatView` or in-combat mechanics — this is
  purely about setup/linking.

## Verification

- Unit/integration tests for the new `/api/campaigns/[id]/encounters`
  routes (link, unlink, list, ownership checks).
- E2E: campaign list → "Start Combat" reaches campaign combat setup;
  "Encounters" tab links/unlinks and reflects in the setup picker;
  ad hoc `/combat` still starts combat with zero campaign encounters
  linked; banner appears only when an active campaign exists.
