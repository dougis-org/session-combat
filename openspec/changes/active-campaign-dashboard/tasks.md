# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/active-campaign-dashboard` then immediately `git push -u origin feature/active-campaign-dashboard`

## Execution

### Task 1 — CharacterRosterCard component

- [x] Create `lib/components/CharacterRosterCard.tsx`
  - Props: `name: string`, `race?: string`, `characterType?: CharacterType`, `classes?: CharacterClass[]`
  - Renders: name, type badge (NPC/Companion only), race · class/level line
  - No AC, no HP, no import of `CombatStatsRow`
  - Uses `calculateTotalLevel` from `lib/types` for multi-class level sum
  - Graceful fallback: race shows "—" if undefined; class/level line hidden if no classes

### Task 2 — CampaignChapterInfo component

- [x] Create `lib/components/CampaignChapterInfo.tsx`
  - Props: `chapters: CampaignChapter[]`, `currentChapterId?: string`
  - Renders current chapter title; falls back to "No chapter set" if `currentChapterId` missing or references absent chapter
  - Keep it ≤ 15 lines — it's a pure display component

### Task 3 — Extend data fetching in campaigns/page.tsx

- [x] Add `parties: Party[]` and `characters: Character[]` state (`useState`)
- [x] Add `sessionsByCampaign: Record<string, SessionLog | null>` state
- [x] Replace separate `fetchCampaigns()` / `fetchTemplates()` with a `Promise.all` that also fetches `GET /api/parties` and `GET /api/characters`
- [x] Derive in render: `activeCampaigns = campaigns.filter(c => c.active)`
- [x] For each active campaign: `linkedParties = parties.filter(p => p.campaignId === campaign.id)`
- [x] For each party: `activeMembers = party.members.filter(m => !m.leftAt)`; resolve each `member.characterId` against `characters`
- [x] Split resolved characters: `characterType === 'character'` or undefined → PCs; `'npc'` or `'companion'` → NPCs/Companions

### Task 4 — Active Campaigns dashboard section UI

- [x] Add Active Campaigns section above the existing management list in `app/campaigns/page.tsx`
- [x] If no active campaigns: render CTA card ("No active campaigns — mark one active or create a new one" with anchor to the management list below)
- [x] For each active campaign, render a campaign card:
  - Campaign name (heading)
  - `<CampaignChapterInfo chapters={campaign.chapters} currentChapterId={campaign.currentChapterId} />`
  - Party sub-cards (one per `linkedParties` entry):
    - Party name as sub-heading
    - Player Characters section: `<CharacterRosterCard>` for each PC; hidden if zero
    - Travelling NPCs & Companions section: `<CharacterRosterCard>` for each NPC/companion; hidden if zero
    - If no linked party: "No party linked — [add one in Parties](/parties)"
  - Quick action buttons: "Open Prompt Builder" → `/prompts`, "Start Encounter" → `/encounters`
- [x] Dark-theme styling consistent with existing page (gray-900/gray-800, card-based, inset party sub-cards)
- [x] Two-column member grid collapses to single column on mobile (`grid-cols-2 sm:grid-cols-1` or equivalent Tailwind)

### Task 5 — Lazy session data fetch

- [x] Add secondary `useEffect` keyed on `activeCampaigns` (fire after main data loads)
- [x] Fetch `GET /api/campaigns/[id]/sessions?limit=1` for each active campaign in parallel
- [x] Store result in `sessionsByCampaign`: `{ [campaignId]: SessionLog | null }`
- [x] In campaign card: render Last Session card only when `sessionsByCampaign[campaign.id]` is defined and non-null
  - Display: "Session {N} — {title} ({datePlayed formatted})"
  - Milestone badge if `session.milestone === true`
  - Link to `/campaigns/[id]/sessions`
- [x] Catch fetch errors silently — set `sessionsByCampaign[id] = null`

### Task 6 — Tests

- [x] `tests/unit/CharacterRosterCard.test.tsx`:
  - PC renders name, race, class/level; no AC/HP in DOM
  - NPC renders "NPC" badge
  - Companion renders "Companion" badge
  - Missing classes renders gracefully
- [x] `tests/unit/CampaignChapterInfo.test.tsx`:
  - Renders correct chapter title
  - Renders fallback when `currentChapterId` missing
  - Renders fallback when `currentChapterId` references absent chapter
- [x] `tests/unit/campaigns-dashboard.test.tsx` (or extend existing campaigns page test):
  - Zero active campaigns → CTA card rendered, no campaign cards
  - Two active campaigns → two campaign cards rendered
  - Active campaign with two linked parties → two party sub-cards
  - Active campaign with no linked party → empty state with link
  - Members with `leftAt` set are excluded from roster
  - Characters split correctly by `characterType` (PC vs NPC/Companion)
  - Last Session card renders when session data present; absent when null
  - Milestone badge appears when `session.milestone === true`
- [x] Integration smoke test: active campaign + linked party + characters → all sections render

## Validation

- [x] `npm run test` — all unit tests pass
- [x] `npm run test:integration` — integration tests pass
- [x] `npm run build` — no type errors, no build failures
- [x] `npm run lint` — no lint errors
- [x] Manual: visit `/campaigns` in dev server, verify dashboard renders correctly for active/inactive/no-campaign states
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review before committing
- [ ] Commit all changes to `feature/active-campaign-dashboard` and push to remote
- [ ] Open PR from `feature/active-campaign-dashboard` to `main` — title: "feat: Active Campaign Dashboard (#186)"
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow Remote push validation, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose any failures, fix, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for PR to merge — **never force-merge**; if a human force-merges, proceed to Post-Merge

Ownership metadata:
- Implementer: dougis
- Reviewer(s): agentic review + human
- Required approvals: 1 human

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update `openspec/specs/` with any approved spec deltas from `specs/*.md`
- [ ] Archive the change: move `openspec/changes/active-campaign-dashboard/` to `openspec/changes/archive/YYYY-MM-DD-active-campaign-dashboard/` — stage both new location and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-active-campaign-dashboard/` exists and `openspec/changes/active-campaign-dashboard/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -d feature/active-campaign-dashboard`
