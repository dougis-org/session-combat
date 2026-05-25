---
name: tests
description: Tests for the prompt-builder-campaign-child change
---

# Tests

## Overview

This document outlines the tests for the `prompt-builder-campaign-child` change. All work follows strict TDD: write failing tests before implementation, write minimal code to pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code
2. **Write the simplest code** to make the test pass
3. **Refactor** while keeping tests green

---

## Test Cases

### Task A2 — Unit tests for `fetchCampaignContext`

File: `tests/unit/utils/campaignContext.test.ts`
Spec reference: `specs/campaign-context/spec.md`

- [ ] **A2-1** Single party linked to campaign → `context.parties.length === 1`, `context.allMembers === party.members`
- [ ] **A2-2** Three parties linked to same campaign with 2, 3, 4 members → `context.parties.length === 3`, `context.allMembers.length === 9`
- [ ] **A2-3** No parties linked to campaign → `context.parties === []`, `context.allMembers === []`
- [ ] **A2-4** Campaign with `currentChapterId` set → `context.chapter.title` matches the chapter in `campaign.chapters`
- [ ] **A2-5** Campaign with `currentChapterId === undefined` → `context.chapter === null`
- [ ] **A2-6** All party members have active characters → `context.characters` contains all resolved `Character` objects
- [ ] **A2-7** One member's character has `deletedAt` set → that character absent from `context.characters`
- [ ] **A2-8** Fetch calls initiated via `Promise.all` (not sequential) → mock assertions confirm all three fetches called before any result is consumed
- [ ] **A2-9** `/api/parties` returns non-OK response → `fetchCampaignContext` rejects with an error; no unhandled rejection

### Task A4 — Hook: `useCampaignContext`

File: `tests/unit/hooks/useCampaignContext.test.ts`
Spec reference: `specs/campaign-context/spec.md`

- [ ] **A4-1** On mount, `loading === true` until `fetchCampaignContext` resolves
- [ ] **A4-2** After successful fetch, `loading === false` and `context` is non-null
- [ ] **A4-3** On fetch error, `error` is non-null string and `context === null`
- [ ] **A4-4** Calling `refresh()` re-triggers `fetchCampaignContext`

### Task B1 — Unit tests for prompt templates

File: `tests/unit/prompts/templates.test.ts`
Spec reference: `specs/prompt-templates/spec.md`

- [ ] **B1-1** NPC template — full context → `systemPrompt` contains campaign name, chapter title, character names; `userMessage` contains role and location field values
- [ ] **B1-2** Location template — full context → `systemPrompt` contains campaign context; `userMessage` contains type and atmosphere
- [ ] **B1-3** Shop template — full context → `systemPrompt` contains campaign context; `userMessage` contains shop type and setting
- [ ] **B1-4** Magic Item template — full context → `systemPrompt` contains campaign context; `userMessage` contains item type and rarity
- [ ] **B1-5** Room Description template — full context → `systemPrompt` contains campaign context; `userMessage` contains room name and purpose
- [ ] **B1-6** All templates → `fullText === systemPrompt + "\n\n" + userMessage` (exact concat)
- [ ] **B1-7** Any template with `context.chapter === null` → no "undefined" or "null" in output; chapter line omitted
- [ ] **B1-8** Any template with `context.characters === []` → no runtime error; output notes no party members
- [ ] **B1-9** Any template with optional field absent → no runtime error; optional content omitted gracefully
- [ ] **B1-10** `buildSystemPrompt` with full context → contains campaign name, module name, chapter title, character name + class/level list
- [ ] **B1-11** `buildSystemPrompt` with null chapter and empty characters → contains campaign name and module name; no crash
- [ ] **B1-12** `TEMPLATES` array contains exactly 5 entries with distinct `id` values
- [ ] **B1-13** Adding a new object to `TEMPLATES` requires no changes to page template-selection logic (structural test — assert `TEMPLATES.map(t => t.id)` is the driver for tab rendering)

### Task C1 — Integration tests for prompt builder page

File: `tests/integration/prompts/promptBuilder.test.tsx`
Spec reference: `specs/prompt-builder-ui/spec.md`

- [ ] **C1-1** Page renders with campaign name in heading when `useCampaignContext` resolves
- [ ] **C1-2** All five template tabs visible; NPC tab active and its fields rendered by default
- [ ] **C1-3** Clicking "Room Description" tab renders room fields and hides NPC fields
- [ ] **C1-4** Filling required NPC fields and clicking Generate → textarea appears containing campaign name and character names
- [ ] **C1-5** Clicking Generate with a required field empty → inline validation message shown; no prompt textarea
- [ ] **C1-6** After Generate, clicking "Copy to Clipboard" → `navigator.clipboard.writeText` called with `fullText`
- [ ] **C1-7** After Copy, "Copied!" confirmation visible briefly
- [ ] **C1-8** "Save to Library" button is present, disabled, and has tooltip text
- [ ] **C1-9** While `loading === true`, loading indicator is visible and template form is not rendered
- [ ] **C1-10** When `error` is non-null, `ErrorBanner` is rendered
- [ ] **C1-11** When `context.parties === []`, informational no-party message is displayed; form is still accessible
- [ ] **C1-12** Unauthenticated access → `ProtectedRoute` redirects to login (verify `ProtectedRoute` is present in the tree)

### Task D1 — Regression tests for session logs (before refactor)

File: `tests/integration/sessions/sessionLogs.test.tsx`
Spec reference: `specs/session-logs-refactor/spec.md`

- [ ] **D1-1** Single party linked to campaign → session log editor suggests NPC join events for all active members of that party
- [ ] **D1-2** Session list renders correctly for a campaign with existing logs
- [ ] **D1-3** Opening the editor for a new session shows the form
- [ ] **D1-4** No party linked to campaign → "No linked party found" message displayed

### Task D2 — Multi-party test for session logs (fails until D3)

File: `tests/integration/sessions/sessionLogs.test.tsx`
Spec reference: `specs/session-logs-refactor/spec.md`

- [ ] **D2-1** Two parties linked to same campaign (Party A: Alice, Bob; Party B: Carol) → NPC join events suggested for Alice, Bob, and Carol (all three)

### Task D3 — Post-refactor regression validation

- [ ] **D3-1** All D1 tests still pass after refactor (no regression)
- [ ] **D3-2** D2-1 multi-party test passes after refactor
- [ ] **D3-3** `buildNpcEventsFromMemberChanges` called with `context.allMembers` (not a single party's members) — verify via mock assertion
