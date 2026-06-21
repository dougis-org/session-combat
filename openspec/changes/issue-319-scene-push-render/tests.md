---
name: tests
description: Tests for the issue-319-scene-push-render change
---

# Tests

## Overview

All work follows strict TDD: write a failing test, make it pass with minimal code, then refactor. Each test case maps to a task in `tasks.md` and an acceptance scenario in `specs/scene-push-render/spec.md`.

## Testing Steps

For each task:

1. **Write a failing test** before any implementation code. Run it; confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** — improve quality without breaking the test.

## Test Cases

### T1 — POST /messages route: scene kind

File: `tests/unit/api/campaigns/[id]/messages.route.test.ts`

Spec ref: "ADDED Scene message creation via POST /messages"

- [ ] **T1-1** DM POSTs `{ kind: 'scene', attachmentId: 'abc', text: 'Caption' }` → 201; response body has `kind: 'scene'`, `attachmentId: 'abc'`, `text: 'Caption'`
- [ ] **T1-2** DM POSTs `{ kind: 'scene', attachmentId: 'abc' }` (no text) → 201; `kind: 'scene'`, `attachmentId: 'abc'` in response
- [ ] **T1-3** DM POSTs `{ kind: 'scene', text: 'Caption only' }` (no attachmentId) → 201; `kind: 'scene'`, `text: 'Caption only'` in response
- [ ] **T1-4** DM POSTs `{ kind: 'scene' }` (neither text nor attachmentId) → 400
- [ ] **T1-5** Non-DM member POSTs `{ kind: 'scene', text: 'Sneaky' }` → 403
- [ ] **T1-6** POST with no `kind` and `text: ''` → 400 (existing behaviour unchanged)
- [ ] **T1-7** POST with no `kind` and valid `text` → 201; `kind` absent in response (existing behaviour)
- [ ] **T1-8** Scene POST emits SSE `message` event with `kind: 'scene'` in data (verify `emitFiltered` called with correct payload)

### T2 — Integration: POST /messages with scene kind

File: `tests/integration/campaigns/messages.integration.test.ts`

Spec ref: "ADDED Scene message creation via POST /messages"

- [ ] **T2-1** DM POSTs scene with attachmentId + text → 201; GET messages returns message with `kind: 'scene'`
- [ ] **T2-2** Non-DM member POSTs kind:'scene' → 403
- [ ] **T2-3** DM POSTs `{ kind: 'scene' }` (no text, no attachmentId) → 400
- [ ] **T2-4** Existing chat POST (no kind, valid text) → 201, kind absent (regression)

### T3 — SceneComposer component

File: `tests/unit/components/SceneComposer.test.tsx`

Spec ref: "ADDED SceneComposer — compose and submit a scene"

- [ ] **T3-1** Send button is disabled when no file is selected
- [ ] **T3-2** Selecting a file > 5 MB shows an error; Send remains disabled
- [ ] **T3-3** Selecting a non-image file (e.g., `application/pdf`) shows a type error; Send remains disabled
- [ ] **T3-4** Selecting a valid JPEG ≤ 5 MB clears errors; Send becomes enabled
- [ ] **T3-5** Send with no file AND no caption: Send stays disabled (nothing to send)
- [ ] **T3-6** Full success: fetch `/attachments` called first; on success fetch `/messages` called with `{ kind:'scene', attachmentId, text }` and `visibility: { scope:'group' }`; `onSuccess` called with returned message
- [ ] **T3-7** Upload failure: `/attachments` returns 4xx; error shown; `/messages` NOT called; `onSuccess` NOT called; composer remains open
- [ ] **T3-8** Message failure: `/attachments` succeeds; `/messages` returns 4xx; error shown; `onSuccess` NOT called; composer remains open
- [ ] **T3-9** Cancel button click: `onCancel` called; no fetch calls made
- [ ] **T3-10** Caption-only (no file, text present): Send enabled; only `/messages` called (no `/attachments`); `onSuccess` called on success

### T4 — SceneFeedItem component

File: `tests/unit/components/SceneFeedItem.test.tsx`

Spec ref: "ADDED Scene message rendering in ChatFeed", "ADDED Enlargeable image overlay"

- [ ] **T4-1** Scene message with `attachmentId`: renders `<img>` with `src="/api/campaigns/[id]/attachments/[attachmentId]"`
- [ ] **T4-2** Scene message with `text`: renders caption text
- [ ] **T4-3** Scene message with image only (no text): `<img>` present; no caption element
- [ ] **T4-4** Scene message with caption only (no attachmentId): caption present; no `<img>` element
- [ ] **T4-5** Clicking `<img>` calls `dialogRef.current.showModal()` (mock `HTMLDialogElement.prototype.showModal`)
- [ ] **T4-6** Clicking backdrop (dialog element) calls `dialogRef.current.close()`
- [ ] **T4-7** `<img>` `onError` fires: placeholder rendered; caption (if present) still visible
- [ ] **T4-8** Regular chat message (`kind` absent or `kind:'chat'`) does NOT render as SceneFeedItem (verify ChatFeed branching in CampaignChat tests or a ChatFeed-level test)

### T5 — CampaignChat: Push Scene button and integration

File: `tests/unit/components/CampaignChat.test.tsx` (extend or new)

Spec ref: "ADDED Push Scene button in CampaignChat (DM only)"

- [ ] **T5-1** DM user (member with `role:'dm'`): "Push Scene" button renders in expanded dock
- [ ] **T5-2** Non-DM member: "Push Scene" button NOT rendered
- [ ] **T5-3** DM clicks "Push Scene": SceneComposer renders; chat composer still accessible
- [ ] **T5-4** SceneComposer `onCancel`: composer unmounts; "Push Scene" button returns
- [ ] **T5-5** SceneComposer `onSuccess(message)`: message appended to feed; `seenIds` updated (duplicate SSE won't re-add); composer unmounts
