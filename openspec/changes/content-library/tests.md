---
name: tests
description: Tests for the content-library change
---

# Tests

## Overview

Test plan for the `content-library` change. All work follows strict TDD: write the failing test first, run to confirm failure, implement against it, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write a test capturing the task's requirement. Run it; confirm it fails.
2. **Write code to pass the test** — write the simplest code that makes it pass.
3. **Refactor** — improve quality while keeping tests green.

---

## Test Cases

### Task 4 — API route integration tests (`lib/api/__tests__/content.test.ts` or project equivalent)

Maps to: specs/content-library/spec.md — SavedContent persistence, Auth scenarios

- [ ] **POST /api/content creates item with all fields**
  - Spec: "DM saves a generated prompt" scenario
  - Assert: response status 201; body contains `systemPrompt`, `userMessage`, `prompt`, `type`, `title`, `campaignId`, `userId`, `createdAt`, `updatedAt`

- [ ] **POST /api/content with empty title is rejected**
  - Spec: "Save is blocked without a title" scenario
  - Assert: response status 400; item not inserted

- [ ] **GET /api/content?campaignId=… returns items newest first**
  - Spec: "Library loads saved items for the campaign" scenario
  - Assert: response status 200; items ordered by `createdAt` descending

- [ ] **GET /api/content does not return items from another user**
  - Spec: "User cannot access another user's content" non-functional security scenario
  - Assert: response contains only items where `userId` matches authenticated user

- [ ] **PUT /api/content/[id] updates result and notes**
  - Spec: "DM pastes response and saves" scenario
  - Assert: response status 200; subsequent GET shows updated `result` and `notes`; `updatedAt` is later than `createdAt`

- [ ] **DELETE /api/content/[id] removes item**
  - Spec: "DM deletes a saved item" scenario
  - Assert: response status 204; subsequent GET does not include the deleted item

- [ ] **GET /api/content with no auth returns 401**
  - Spec: "Unauthenticated access is rejected" non-functional security scenario
  - Assert: response status 401; no content data in body

- [ ] **DELETE /api/content/[id] with no auth returns 401**
  - Spec: "Unauthenticated access is rejected" non-functional security scenario
  - Assert: response status 401

---

### Task 6 — Library page integration tests

Maps to: specs/content-library/spec.md — Library page, Card display, Edit/Delete scenarios

- [ ] **Library page renders all items for campaign**
  - Spec: "Library loads saved items for the campaign" scenario
  - Assert: mock GET returns 3 items; all 3 cards rendered

- [ ] **Filter tab shows only matching type**
  - Spec: "Filter tabs narrow items by type" scenario
  - Assert: click "NPC" tab; only NPC cards visible; location and shop cards hidden

- [ ] **Empty state renders when no items**
  - Spec: "Empty library shows empty state" scenario
  - Assert: mock GET returns `[]`; empty state message rendered; no error banner

- [ ] **Collapsed card shows type badge, title, chapter, date, result checkmark when result present**
  - Spec: "Collapsed card shows all summary fields" scenario
  - Assert: card with `type='npc'`, `title='Old Grigor'`, `chapter='Chapter 2'`, non-empty `result` — all four fields visible plus checkmark

- [ ] **Collapsed card without result shows no checkmark**
  - Spec: "Card without result shows no checkmark" scenario
  - Assert: card with empty `result` — checkmark element absent

- [ ] **Expanding card shows systemPrompt in muted section and userMessage in bright section**
  - Spec: "Expanded card shows system and user message separately" scenario
  - Assert: click card; "SYSTEM" labelled section contains `systemPrompt` text; "USER" labelled section contains `userMessage` text

- [ ] **Copy Full Prompt copies prompt (fullText)**
  - Spec: "Copy Full Prompt copies fullText" scenario
  - Assert: click "Copy Full Prompt"; clipboard contains `prompt` field value (not just `userMessage`)

- [ ] **Save button calls PUT and shows success**
  - Spec: "DM pastes response and saves" scenario
  - Assert: edit response textarea, click Save; PUT called with updated `result`; success feedback shown

- [ ] **Save failure shows error banner and form values are not lost**
  - Spec: "Save failure shows error banner" non-functional reliability scenario
  - Assert: mock PUT returns 500; error banner shown; textarea value unchanged

- [ ] **Delete button calls DELETE and removes card**
  - Spec: "DM deletes a saved item" scenario
  - Assert: click Delete; DELETE called with item id; card no longer in DOM

---

### Task 9 — Prompt Builder save flow integration tests

Maps to: specs/content-library/spec.md — Modified Save to Library button scenarios

- [ ] **Save to Library button is disabled before generate**
  - Spec: "Save is blocked before a prompt is generated" scenario
  - Assert: render prompt builder without generating; Save to Library button has `disabled` attribute

- [ ] **After generate, clicking Save to Library opens inline save panel**
  - Spec: "Save panel opens after prompt generation" scenario
  - Assert: generate prompt; click Save to Library; save panel visible with title input and Save/Cancel buttons

- [ ] **Save panel pre-fills title with first non-empty template field value**
  - Spec: "Title pre-filled from first field" scenario
  - Assert: NPC template with role "innkeeper"; open save panel; title input value is "innkeeper"

- [ ] **Editing title then saving uses the edited value**
  - Spec: "Title pre-fill is editable" scenario
  - Assert: clear pre-filled title, type "Custom Title"; click Save; POST body contains `title: "Custom Title"`

- [ ] **Successful save shows confirmation with library link**
  - Spec: "Successful save shows confirmation" scenario
  - Assert: mock POST returns 201; confirmation message visible; link to `/campaigns/[id]/library` present

- [ ] **API failure shows error banner and panel stays open**
  - Spec: "Save API failure does not lose prompt" non-functional reliability scenario
  - Assert: mock POST returns 500; error banner shown; save panel still visible; generated prompt still visible

- [ ] **Cancel closes save panel without API call**
  - Spec: "Cancel dismisses the save panel" scenario
  - Assert: open save panel; click Cancel; panel hidden; no POST call made
