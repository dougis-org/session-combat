## GitHub Issues

- #189 — Campaign DM notes and lifecycle status
- #231 — Prompt Builder DM notes toggle (out of scope, tracked separately)

## Why

- **Problem statement:** The `Campaign` model has an `active: boolean` field that is semantically insufficient — it cannot express where a campaign is in its lifecycle (planning, running, on hold, finished). There is also no field for a DM to capture freeform working notes (current quests, NPC states, world events) that would make the app genuinely useful as a session-prep tool.
- **Why now:** All dependencies (#182, #184, #186) are complete. The `active` field is already wired across the UI, API, and tests — replacing it now, while the project is in Beta with minimal live data, is far less costly than doing it later.
- **Business/user impact:** DMs gain a scratchpad tied to the campaign and a clear lifecycle signal. The dashboard becomes more informative. The `active` boolean ambiguity (does false mean "planning" or "abandoned"?) is resolved.

## Problem Space

- **Current behavior:** `Campaign` has `active: boolean` (default `false`). The Active Campaign Dashboard filters by `c.active === true`. There is no notes field. The form has an "Active" checkbox with no way to express on-hold or completed state.
- **Desired behavior:** `Campaign` has `status: 'planning' | 'active' | 'on-hold' | 'completed'` (default `'active'`) and `notes: string` (default `''`). The dashboard filters by `c.status === 'active'`. The form has a status dropdown and a notes textarea.
- **Constraints:**
  - No Mongoose — raw MongoDB driver, plain TypeScript interfaces. Storage is a pass-through upsert; no storage-layer changes needed for new fields.
  - No new Badge component — follow existing inline Tailwind span pattern (`px-2 py-1 bg-X text-xs rounded`).
  - Notes capped at 10,000 chars, enforced inline in PATCH handler.
- **Assumptions:**
  - Beta project with minimal live data — no database migration script required. Any existing documents without `status` will be handled by API defaults on next save.
  - The `active` field is not used anywhere outside the files identified in the touch-point list.
- **Edge cases considered:**
  - Campaign copy (global template copy route) previously set `active: false` — now sets `status: 'planning'`.
  - Existing test fixtures use `active: boolean` — all must be updated to `status: string`.
  - The "No active campaigns" messaging and CTA text needs updating to reflect status-based language.

## Scope

### In Scope

- Remove `active: boolean` from `Campaign` interface in `lib/types.ts`
- Add `status: 'planning' | 'active' | 'on-hold' | 'completed'` to `Campaign` interface
- Add `notes: string` to `Campaign` interface
- Update POST and PATCH campaign API routes to handle `status` and `notes`; validate enum; enforce 10k notes limit
- Update global campaign copy route to set `status: 'planning'`
- Replace active checkbox with status dropdown in `CampaignEditor.tsx`
- Add notes textarea to `CampaignEditor.tsx`
- Update `app/campaigns/page.tsx`: filter, badge display, dashboard notes snippet, CTA text
- Update all test fixtures and assertions that reference `active`

### Out of Scope

- Prompt Builder DM notes injection toggle (tracked in #231)
- Database migration script (Beta — minimal live data)
- Any gating or business logic based on status (e.g., locking completed campaigns)
- Status change confirmation dialogs (e.g., "Are you sure you want to mark this completed?")

## What Changes

- `lib/types.ts` — `Campaign` interface: remove `active`, add `status`, add `notes`
- `app/api/campaigns/route.ts` — POST: replace `active` with `status`
- `app/api/campaigns/[id]/route.ts` — PATCH: replace `active` with `status` + `notes`; add validation
- `app/api/campaigns/global/[id]/copy/route.ts` — replace `active: false` with `status: 'planning'`
- `app/campaigns/CampaignEditor.tsx` — active checkbox → status dropdown; add notes textarea
- `app/campaigns/page.tsx` — filter expression, badge rendering, dashboard notes snippet, CTA text
- `tests/unit/components/CampaignsPage.test.tsx` — fixture + assertions
- `tests/unit/components/CampaignEditor.test.tsx` — checkbox tests → dropdown tests
- `tests/unit/utils/campaignContext.test.ts` — fixture
- `tests/unit/storage/campaigns.test.ts` — fixture
- `tests/unit/campaigns-dashboard.test.tsx` — filter tests, INACTIVE_CAMPAIGN fixture

## Risks

- Risk: Missed `active` reference in a file not in the touch-point list
  - Impact: Runtime error or type error; `active` remains in API response
  - Mitigation: After implementation, grep the entire codebase for `\.active` and `active:` scoped to Campaign context before marking done

- Risk: Existing MongoDB documents have no `status` field
  - Impact: `c.status === 'active'` filter silently drops campaigns that haven't been re-saved
  - Mitigation: API GET handler can default `status` to `'active'` when field is absent (backwards-compatible read); or accept the Beta risk and note it

## Open Questions

No unresolved ambiguity. All decisions were made during the explore session and are captured in this proposal and in GitHub issue #189.

## Non-Goals

- Prompt Builder notes injection (see #231)
- Campaign archival or deletion on status change
- Status history / audit trail
- Enforcement of status transition rules (e.g., must go through 'planning' before 'active')

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
