## GitHub Issues

- dougis-org/session-combat#182

## Why

- **Problem statement:** session-combat has no concept of a campaign. Encounters, parties, and characters exist in isolation with no way to group them under an adventure, track which module is being run, or know what chapter the party is on. DMs must mentally track this context outside the app.
- **Why now:** The app has a solid foundation of encounters, parties, and characters. Campaign context is the natural next layer — it gives the DM a meaningful home screen and makes the data model coherent for multi-session play.
- **Business/user impact:** Improves the DM experience significantly: one landing page shows all active campaigns and their progress instead of landing on a raw encounter list. Sets up the data model for future scoping of encounters and characters to campaigns.

## Problem Space

- **Current behavior:** No campaign concept. The app defaults to the encounters page. Parties and encounters are user-scoped only, with no grouping above that level.
- **Desired behavior:** DMs can create and manage campaigns (name, module/adventure, current chapter). The app lands on a Campaign Dashboard. Parties can be associated with a campaign. DMs can run multiple campaigns simultaneously with no restrictions.
- **Constraints:**
  - No Mongoose — this project uses the raw `mongodb` Node.js driver with plain TypeScript interfaces (`lib/types.ts`) and `lib/storage.ts` functions
  - Auth pattern: `requireAuth` from `lib/middleware` (all campaign routes must use it)
  - No uniqueness enforcement on `active` — it is a personal preference flag only
- **Assumptions:**
  - Multiple simultaneous active campaigns are allowed (no "one active at a time" constraint)
  - `currentChapter` is a free-form string label (e.g., `"Chapter 4: The Sunken Temple"`) with a companion `currentChapterOrder: number` for sorting
  - Party → Campaign is optional (`campaignId?: string`) — existing parties without a campaign remain valid
- **Edge cases considered:**
  - Deleting a campaign while parties reference it — `campaignId` on those parties becomes a dangling reference; safe to leave (display gracefully as "No Campaign")
  - DM with no campaigns yet — Campaign Dashboard shows an empty state with a prominent "New Campaign" CTA

## Scope

### In Scope

- `Campaign` interface in `lib/types.ts` (id, userId, name, moduleName, currentChapter, currentChapterOrder, active, createdAt, updatedAt)
- Optional `campaignId?: string` added to the `Party` interface
- Storage functions: `loadCampaigns`, `saveCampaign`, `deleteCampaign` in `lib/storage.ts`
- REST API: `GET/POST /api/campaigns` and `GET/PATCH/DELETE /api/campaigns/[id]`
- Campaign Dashboard at `app/campaigns/page.tsx` — list, create, edit, delete inline
- Campaign Dashboard as the app's landing page (default route) and first nav item in `app/layout.tsx`
- Party UI updated to allow selecting a campaign when creating or editing a party

### Out of Scope

- Scoping encounters to a campaign (future)
- Scoping characters to a campaign (future)
- Paid-tier gating or campaign limits
- Campaign sharing between users
- Chapter management as a separate sub-entity (a list of chapters per campaign)

## What Changes

- `lib/types.ts` — new `Campaign` interface; `campaignId?` on `Party`
- `lib/storage.ts` — new campaign CRUD functions
- `app/api/campaigns/route.ts` — GET list + POST create
- `app/api/campaigns/[id]/route.ts` — GET one + PATCH update + DELETE
- `app/campaigns/page.tsx` — Campaign Dashboard (new landing page)
- `app/layout.tsx` — "Campaigns" added as first nav item; default route updated
- `app/parties/page.tsx` (or equivalent) — campaign selector added to party create/edit form

## Risks

- **Risk:** Dangling `campaignId` references on parties after campaign deletion
  - **Impact:** Low — UI shows "No Campaign" gracefully; no data loss
  - **Mitigation:** Handle null/missing campaign gracefully in the parties UI; document the behavior

- **Risk:** Campaign Dashboard becoming the default route breaks any deep-linked bookmarks to the old default
  - **Impact:** Low — existing app has no documented deep links
  - **Mitigation:** Old default route redirects or becomes the campaigns page directly

- **Risk:** `currentChapterOrder` drift — DMs don't keep it accurate
  - **Impact:** Low — it's a helper field, not enforced
  - **Mitigation:** Default to 0 on create; optional in the form

## Open Questions

No unresolved ambiguity remains. All design decisions were confirmed during exploration:
- No active-campaign uniqueness constraint ✓
- Party association in scope from day 1 ✓
- `currentChapter` is string + order ✓
- Campaign Dashboard as landing page + first nav ✓
- No Mongoose (raw mongodb driver) ✓

## Non-Goals

- Encounter → Campaign scoping
- Character → Campaign scoping
- Campaign limits or paid-tier gating
- Multi-user campaign collaboration
- Nested chapter management

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
