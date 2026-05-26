---
name: tests
description: Tests for campaign-notes-and-status
---

# Tests

## Overview

All implementation follows strict TDD: write a failing test → write minimal code to pass → refactor. Each test case below maps to a task in `tasks.md` and an acceptance scenario in `specs/campaign-model.md`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before any implementation code. Run it and confirm it fails.
2. **Write the minimal code** to make the test pass.
3. **Refactor** without breaking the test.

## Test Cases

### Phase 1 — Data model and API (tasks 1.1–1.4)

**Task 1.1 — Type update**
- [ ] TypeScript compile (`npx tsc --noEmit`) fails after removing `active` until all callers are updated — used as a compile-driven red/green signal, not a Jest test

**Task 1.2 — POST route**
- [ ] `POST /api/campaigns` with no `status` → response body contains `status: 'active'`, no `active` field
- [ ] `POST /api/campaigns` with `status: 'planning'` → response body contains `status: 'planning'`
- [ ] `POST /api/campaigns` with no `notes` → response body contains `notes: ''`
- [ ] `POST /api/campaigns` with `notes: 'some text'` → response body contains `notes: 'some text'`

**Task 1.3 — PATCH route**
- [ ] `PATCH /api/campaigns/[id]` with `status: 'completed'` → 200, response `status: 'completed'`
- [ ] `PATCH /api/campaigns/[id]` with `status: 'on-hold'` → 200, response `status: 'on-hold'`
- [ ] `PATCH /api/campaigns/[id]` with `status: 'running'` (invalid) → 400
- [ ] `PATCH /api/campaigns/[id]` with `status: ''` (empty string) → 400
- [ ] `PATCH /api/campaigns/[id]` with `notes` of exactly 10,000 chars → 200
- [ ] `PATCH /api/campaigns/[id]` with `notes` of 10,001 chars → 400
- [ ] `PATCH /api/campaigns/[id]` where stored document has no `status` field → treated as `'active'`, PATCH succeeds
- [ ] Response from PATCH does not include an `active` field

**Task 1.4 — Global copy route**
- [ ] `POST /api/campaigns/global/[id]/copy` → response contains `status: 'planning'`, no `active` field

### Phase 2 — UI components (tasks 2.1–2.2)

**Task 2.1 — CampaignEditor**
- [ ] Renders a `<select>` for status (not a checkbox labelled "Active")
- [ ] Status dropdown shows current campaign `status` value as selected option
- [ ] Changing status dropdown to "Completed" and saving calls `onSave` with `status: 'completed'`
- [ ] Changing status dropdown to "On Hold" and saving calls `onSave` with `status: 'on-hold'`
- [ ] Notes textarea renders with the campaign's current `notes` value
- [ ] Notes textarea has `maxLength={10000}` attribute
- [ ] Character counter renders showing `{length}/10000`
- [ ] No `active` prop or reference exists in the rendered output

**Task 2.2 — Campaigns page**
- [ ] Campaign with `status: 'active'` appears in Active Campaigns dashboard section
- [ ] Campaign with `status: 'planning'` does not appear in Active Campaigns dashboard section
- [ ] Campaign with `status: 'on-hold'` does not appear in Active Campaigns dashboard section
- [ ] Campaign with `status: 'completed'` does not appear in Active Campaigns dashboard section
- [ ] Zero `status: 'active'` campaigns → CTA card rendered with text "set one to Active or create a new one"
- [ ] Status badge for `planning` renders with class containing `bg-slate-600`
- [ ] Status badge for `active` renders with class containing `bg-green-700`
- [ ] Status badge for `on-hold` renders with class containing `bg-yellow-600`
- [ ] Status badge for `completed` renders with class containing `bg-gray-600`
- [ ] Active campaign with non-empty `notes` → DM Notes snippet section renders in dashboard card
- [ ] Active campaign with empty `notes` (`''`) → no DM Notes section in dashboard card
- [ ] Active campaign with whitespace-only `notes` → no DM Notes section in dashboard card

### Phase 3 — Test fixture updates (tasks 3.1–3.5)

**Task 3.1 — Fixture migration**
- [ ] `CampaignsPage.test.tsx` BASE_CAMPAIGN has `status` not `active` — all existing tests pass
- [ ] `CampaignEditor.test.tsx` BASE_CAMPAIGN has `status` not `active` — all existing tests pass
- [ ] `campaignContext.test.ts` fixture has `status` not `active` — all existing tests pass
- [ ] `campaigns.test.ts` fixture has `status` not `active` — all existing tests pass
- [ ] `campaigns-dashboard.test.tsx` BASE_CAMPAIGN has `status: 'active'`; INACTIVE_CAMPAIGN has `status: 'planning'` — all existing tests pass

**Task 3.6 — Grep verification**
- [ ] `grep -rn "\.active\b\|active:" app/ lib/ tests/ --include="*.ts" --include="*.tsx" | grep -i "campaign"` → zero matches

## Spec Traceability

| Test case | Spec scenario | Task |
|-----------|---------------|------|
| POST no status → `status:'active'` | ADDED: Create campaign with no status defaults to 'active' | 1.2 |
| POST with `status:'planning'` | ADDED: Create campaign with explicit status | 1.2 |
| PATCH invalid status → 400 | ADDED: PATCH with invalid status is rejected | 1.3 |
| PATCH notes 10,001 chars → 400 | ADDED: PATCH with notes over limit is rejected | 1.3 |
| PATCH notes 10,000 chars → 200 | ADDED: PATCH with notes under limit | 1.3 |
| Copy route → `status:'planning'` | ADDED: Campaign copy sets status to 'planning' | 1.4 |
| Dashboard shows `status:'active'` only | MODIFIED: Campaign dashboard filters by status | 2.2 |
| Status badge colour per value | MODIFIED: Campaign status badge in list | 2.2 |
| Notes snippet / no snippet | MODIFIED: Campaign dashboard shows notes snippet | 2.2 |
| Dropdown renders / saves | MODIFIED: Campaign form — status dropdown | 2.1 |
| Textarea renders / maxLength | MODIFIED: Campaign form — notes textarea | 2.1 |
| No `active` field in responses | REMOVED: `active: boolean` | 1.2, 1.3, 1.4 |
