---
name: tests
description: Tests for the prompt-builder-session-context change
---

# Tests

## Overview

Tests for injecting recent session logs into Prompt Builder context. All work follows strict TDD: write a failing test first, then implement, then refactor.

Test files involved:
- `tests/unit/utils/campaignContext.test.ts` — `fetchCampaignContext` tests
- `tests/unit/prompts/templates.test.ts` — `buildSystemPrompt` tests (create if absent)

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code.
2. **Write the simplest code to make the test pass.**
3. **Refactor** while keeping the test green.

---

## Test Cases

### Task 2 — `CampaignContext` type extension

- [ ] **TC-2-1:** TypeScript compilation passes after adding `recentSessions?: SessionLog[]` to `CampaignContext`
  - Verify: `npx tsc --noEmit` exits 0
  - Spec: ADDED "Session context in CampaignContext"

---

### Task 3 — `fetchCampaignContext` sessions fetch

- [ ] **TC-3-1:** Sessions endpoint called with correct URL
  - Test file: `tests/unit/utils/campaignContext.test.ts`
  - Given: mock fetch for all four endpoints
  - When: `fetchCampaignContext("abc123")` is called
  - Then: fetch was called with `/api/campaigns/abc123/sessions?limit=3`
  - TDD: add assertion to existing fetch-mock before adding sessions to `Promise.all`
  - Spec: MODIFIED "fetchCampaignContext fetches four endpoints in parallel"

- [ ] **TC-3-2:** Sessions data is included in returned context
  - Given: sessions endpoint returns `[{ id: "s1", sessionNumber: 5, title: "The Siege", datePlayed: "2026-05-14", milestone: false, ... }]`
  - When: `fetchCampaignContext` resolves
  - Then: `context.recentSessions` has length 1 and `context.recentSessions[0].sessionNumber === 5`
  - Spec: ADDED "Session context in CampaignContext" — happy path scenario

- [ ] **TC-3-3:** Zero sessions returns empty array
  - Given: sessions endpoint returns `[]`
  - When: `fetchCampaignContext` resolves
  - Then: `context.recentSessions` is `[]`
  - Spec: ADDED "Session context in CampaignContext" — no sessions scenario

- [ ] **TC-3-4:** Sessions endpoint 500 → resolves with empty array, does not throw
  - Given: sessions endpoint returns status 500
  - When: `fetchCampaignContext` is awaited
  - Then: promise resolves (does not reject), `context.recentSessions` is `[]`
  - Spec: ADDED "Session context in CampaignContext" — error scenario
  - Non-functional: reliability scenario

- [ ] **TC-3-5:** Sessions endpoint network error → resolves with empty array, does not throw
  - Given: sessions fetch mock throws `new Error("Network error")`
  - When: `fetchCampaignContext` is awaited
  - Then: promise resolves, `context.recentSessions` is `[]`
  - Spec: ADDED "Session context in CampaignContext" — error scenario

- [ ] **TC-3-6:** Existing tests pass with sessions mock added
  - All pre-existing test cases in `campaignContext.test.ts` must continue to pass after sessions mock is added to their setup
  - Spec: regression guard

---

### Task 4 — `buildSystemPrompt` session block

- [ ] **TC-4-1:** No session block when `recentSessions` is `[]`
  - Test file: `tests/unit/prompts/templates.test.ts`
  - Given: `context.recentSessions = []`
  - When: `buildSystemPrompt(context)` is called
  - Then: returned string does not contain `"Recent sessions:"`
  - Spec: ADDED "Recent sessions block" — no sessions scenario

- [ ] **TC-4-2:** No session block when `recentSessions` is undefined
  - Given: `recentSessions` field is absent from context
  - When: `buildSystemPrompt(context)` is called
  - Then: returned string does not contain `"Recent sessions:"`
  - Spec: ADDED "Recent sessions block" — no sessions scenario

- [ ] **TC-4-3:** Session block present with correct heading
  - Given: `recentSessions` contains one entry
  - When: `buildSystemPrompt(context)` is called
  - Then: returned string contains `"Recent sessions:"` on its own line
  - Spec: ADDED "Recent sessions block" — happy path

- [ ] **TC-4-4:** Session line format — title and date
  - Given: one session with `sessionNumber: 11`, `title: "The Betrayer Revealed"`, `datePlayed: new Date("2026-05-14")`, `milestone: false`
  - When: `buildSystemPrompt(context)` is called
  - Then: output contains `"- Session 11 (May 14, 2026): The Betrayer Revealed"`
  - Spec: ADDED "Recent sessions block" — happy path

- [ ] **TC-4-5:** Milestone with newLevel appends correct suffix
  - Given: session with `milestone: true`, `newLevel: 11`
  - When: `buildSystemPrompt(context)` is called
  - Then: session line ends with `"— party reached Level 11."`
  - Spec: ADDED "Recent sessions block" — milestone with newLevel scenario

- [ ] **TC-4-6:** Milestone without newLevel appends fallback suffix
  - Given: session with `milestone: true`, `newLevel` absent or undefined
  - When: `buildSystemPrompt(context)` is called
  - Then: session line ends with `"— milestone reached."`
  - Spec: ADDED "Recent sessions block" — milestone without newLevel scenario

- [ ] **TC-4-7:** Session with no title uses "Untitled Session"
  - Given: session with `title` absent or empty string
  - When: `buildSystemPrompt(context)` is called
  - Then: session line contains `"Untitled Session"`
  - Spec: ADDED "Recent sessions block" — no title scenario

- [ ] **TC-4-8:** Multiple sessions render in order
  - Given: `recentSessions` contains sessions with `sessionNumber` 10, 11, 12
  - When: `buildSystemPrompt(context)` is called
  - Then: all three sessions appear in the output; Session 12 appears before Session 10 (order matches array order from API)
  - Spec: ADDED "Recent sessions block" — happy path

---

### Task 5 — Loading label

- [ ] **TC-5-1:** Loading label string is updated
  - Verify by code search: `grep -r "Loading campaign and session history" app/campaigns/\[id\]/prompts/page.tsx` returns a match
  - Verify old string is absent: `grep -r "Loading campaign context\.\.\." app/campaigns/\[id\]/prompts/page.tsx` returns no match
  - Spec: ADDED "Prompt Builder loading label reflects sessions fetch"

---

## Coverage Summary

| Test Case | Task | Spec Scenario | Type |
|---|---|---|---|
| TC-2-1 | Task 2 | Type extension | TypeScript |
| TC-3-1 | Task 3 | Sessions URL | Unit |
| TC-3-2 | Task 3 | Sessions data in context | Unit |
| TC-3-3 | Task 3 | Zero sessions | Unit |
| TC-3-4 | Task 3 | 500 error → empty array | Unit |
| TC-3-5 | Task 3 | Network error → empty array | Unit |
| TC-3-6 | Task 3 | Regression guard | Unit |
| TC-4-1 | Task 4 | No block, empty array | Unit |
| TC-4-2 | Task 4 | No block, undefined | Unit |
| TC-4-3 | Task 4 | Block heading present | Unit |
| TC-4-4 | Task 4 | Line format | Unit |
| TC-4-5 | Task 4 | Milestone + newLevel | Unit |
| TC-4-6 | Task 4 | Milestone, no newLevel | Unit |
| TC-4-7 | Task 4 | No title fallback | Unit |
| TC-4-8 | Task 4 | Multiple sessions order | Unit |
| TC-5-1 | Task 5 | Loading label string | Static |
