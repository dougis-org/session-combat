---
name: tests
description: Tests for the prompt-builder-dm-notes-toggle change
---

# Tests

## Overview

This document outlines the tests for the `prompt-builder-dm-notes-toggle` change. All work follows strict TDD: write a failing test first, then implement the minimum code to pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements. Run it and confirm it fails.
2. **Write code to pass the test:** Write the simplest code that makes the test pass.
3. **Refactor:** Improve structure while keeping the test green.

## Test Cases

### Task 3 — Extend `buildSystemPrompt`

Map to spec: `specs/dm-notes-toggle/spec.md` — MODIFIED `buildSystemPrompt`

- [ ] **Test: notes block absent when `opts` omitted**
  - File: `tests/unit/prompts/templates.test.ts`
  - Setup: build a `CampaignContext` with `campaign.notes = "some notes"`; call `buildSystemPrompt(ctx)` with no second arg
  - Assert: result does NOT contain `"Current campaign context (DM notes):"`
  - Spec scenario: "Existing call sites unaffected"

- [ ] **Test: notes block absent when `opts.includeNotes` is `false`**
  - File: `tests/unit/prompts/templates.test.ts`
  - Setup: call `buildSystemPrompt(ctx, { includeNotes: false })` with non-empty notes
  - Assert: result does NOT contain `"Current campaign context (DM notes):"`
  - Spec scenario: "Notes block absent when toggle unchecked"

- [ ] **Test: notes block present when `opts.includeNotes` is `true`**
  - File: `tests/unit/prompts/templates.test.ts`
  - Setup: call `buildSystemPrompt(ctx, { includeNotes: true })` with `campaign.notes = "Quest hook: the gate is sealed."`
  - Assert: result contains `"Current campaign context (DM notes):\nQuest hook: the gate is sealed."`
  - Spec scenario: "Notes block present when toggle checked" / "Notes block format is correct"

- [ ] **Test: notes block absent when notes are whitespace only, even with `includeNotes: true`**
  - File: `tests/unit/prompts/templates.test.ts`
  - Setup: call `buildSystemPrompt(ctx, { includeNotes: true })` with `campaign.notes = "   "`
  - Assert: result does NOT contain `"Current campaign context (DM notes):"`
  - Spec scenario: "Checkbox hidden when notes are whitespace only" (mirrors server-side guard)

### Task 4 — Thread `opts` through `PromptTemplate.build`

- [ ] **Test: `npcTemplate.build` passes opts through to prompt output**
  - File: `tests/unit/prompts/templates.test.ts`
  - Setup: call `npcTemplate.build(fields, ctx, { includeNotes: true })` with non-empty notes
  - Assert: `builtPrompt.fullText` contains the notes block
  - Spec scenario: "Notes block present when toggle checked"

- [ ] **Test: TypeScript compilation passes** (implicit — enforced by `npx tsc --noEmit` in Validation step)

### Task 5 — Checkbox UI in `app/campaigns/[id]/prompts/page.tsx`

Map to spec: `specs/dm-notes-toggle/spec.md` — ADDED DM notes toggle checkbox

- [ ] **Test: checkbox not rendered when `campaign.notes` is empty**
  - File: `tests/unit/components/CampaignsPage.test.tsx` or a dedicated `PromptBuilderPage.test.tsx`
  - Setup: render `PromptBuilderContent` with a mock context where `campaign.notes = ""`
  - Assert: `queryByLabelText("Include DM notes in prompt")` returns `null`
  - Spec scenario: "Checkbox hidden when notes are absent"

- [ ] **Test: checkbox not rendered when `campaign.notes` is whitespace only**
  - File: same as above
  - Setup: render with `campaign.notes = "   "`
  - Assert: checkbox label absent from DOM
  - Spec scenario: "Checkbox hidden when notes are whitespace only"

- [ ] **Test: checkbox rendered when `campaign.notes` is non-empty**
  - File: same as above
  - Setup: render with `campaign.notes = "Active quest: find the lost relic."`
  - Assert: `getByLabelText("Include DM notes in prompt")` is present and unchecked by default
  - Spec scenario: "Checkbox visible when notes are present" / "Checkbox unchecked on initial load"

- [ ] **Test: toggling checkbox clears generated prompt**
  - File: same as above
  - Setup: render, generate a prompt, then fire a click on the checkbox
  - Assert: the prompt output section is no longer visible
  - Spec scenario: "Generated prompt cleared when toggle changes"

## Regression Guard

- [ ] **All existing `templates.test.ts` tests pass without modification** — `buildSystemPrompt` behaviour is unchanged when `opts` is omitted
- [ ] **`npm test` passes in full** before opening the PR
