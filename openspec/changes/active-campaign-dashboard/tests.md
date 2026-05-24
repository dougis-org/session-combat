---
name: tests
description: Tests for the active-campaign-dashboard change
---

# Tests

## Overview

All work follows TDD: write a failing test first, implement the simplest code to pass it, then refactor. Each test case maps to a task in `tasks.md` and an acceptance scenario in `specs/`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code. Run it; confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** — improve structure while keeping the test green.

## Test Cases

### Task 1 — CharacterRosterCard (`tests/unit/CharacterRosterCard.test.tsx`)

- [ ] **T1.1** — PC renders name, race, class/level; AC and HP absent from rendered output
  - Spec: `specs/roster.md` — "Player character renders identity fields"
- [ ] **T1.2** — NPC renders "NPC" badge alongside name
  - Spec: `specs/roster.md` — "NPC renders type badge"
- [ ] **T1.3** — Companion renders "Companion" badge alongside name
  - Spec: `specs/roster.md` — "Companion renders type badge"
- [ ] **T1.4** — Character with no classes renders without crash; no class/level line shown
  - Spec: `specs/roster.md` — "Character with no classes renders gracefully"
- [ ] **T1.5** — Character with undefined race renders "—" or omits race gracefully
  - Spec: `specs/roster.md` — "CharacterRosterCard handles missing optional fields"

### Task 2 — CampaignChapterInfo (`tests/unit/CampaignChapterInfo.test.tsx`)

- [ ] **T2.1** — Renders current chapter title when `currentChapterId` matches a chapter in `chapters`
  - Spec: `specs/roster.md` — "Current chapter renders correctly"
- [ ] **T2.2** — Renders fallback text ("No chapter set") when `currentChapterId` is undefined
  - Spec: `specs/roster.md` — "No currentChapterId set"
- [ ] **T2.3** — Renders fallback text when `currentChapterId` references a chapter id not present in `chapters`
  - Spec: `specs/roster.md` — "currentChapterId references missing chapter"

### Task 3 — Fetch logic in campaigns/page.tsx (`tests/unit/campaigns-dashboard.test.tsx`)

- [ ] **T3.1** — On mount, `fetch` is called for `/api/campaigns`, `/api/parties`, `/api/characters`, and `/api/campaigns/global` (all four in parallel)
  - Spec: `specs/dashboard.md` — "All three fetches fire in parallel"
- [ ] **T3.2** — Active members correctly derived: member with `leftAt` set is excluded from roster
  - Spec: `specs/dashboard.md` — "Departed members excluded"
- [ ] **T3.3** — Characters split: `characterType === 'character'` or undefined → PC bucket; `'npc'` or `'companion'` → NPC bucket
  - Spec: `specs/dashboard.md` — "Members split by characterType"

### Task 4 — Dashboard section UI (`tests/unit/campaigns-dashboard.test.tsx`)

- [ ] **T4.1** — Zero active campaigns → CTA card rendered; no campaign cards rendered
  - Spec: `specs/dashboard.md` — "No active campaigns — CTA card"
- [ ] **T4.2** — Two campaigns with `active: true` → two campaign cards rendered
  - Spec: `specs/dashboard.md` — "Multiple active campaigns shown"
- [ ] **T4.3** — Active campaign with two linked parties → two party sub-cards rendered within the campaign card
  - Spec: `specs/dashboard.md` — "Active campaign with two linked parties"
- [ ] **T4.4** — Active campaign with no linked party → empty state with link to `/parties` rendered
  - Spec: `specs/dashboard.md` — "Campaign with no linked party shows empty state"
- [ ] **T4.5** — PC section hidden when party has only NPC members
  - Spec: `specs/dashboard.md` — "PC section hidden when no PCs"
- [ ] **T4.6** — Existing campaign management list renders below the dashboard section
  - Spec: `specs/dashboard.md` — "Existing management list unchanged"

### Task 5 — Last Session card (`tests/unit/campaigns-dashboard.test.tsx`)

- [ ] **T5.1** — Last Session card renders session number, title, date when session data present
  - Spec: `specs/session-card.md` — "Last Session card renders when data is present"
- [ ] **T5.2** — Milestone badge visible when `session.milestone === true`
  - Spec: `specs/session-card.md` — "Milestone badge shown when session has milestone"
- [ ] **T5.3** — Last Session card absent when session fetch returns empty array
  - Spec: `specs/session-card.md` — "Last Session card absent when no session data"
- [ ] **T5.4** — Main campaign cards and party sub-cards render before session useEffect fires
  - Spec: `specs/session-card.md` — "Main dashboard renders before session fetch resolves"
- [ ] **T5.5** — Session fetch failure (network error/500) is swallowed; no error boundary triggered; other content unaffected
  - Spec: `specs/session-card.md` — "Session fetch failure is silent"

### Integration

- [ ] **T6.1** — Active campaign + linked party + characters → all sections (header, party sub-card, roster cards) render without error
  - Spec: `specs/dashboard.md` — "Integration smoke test"
