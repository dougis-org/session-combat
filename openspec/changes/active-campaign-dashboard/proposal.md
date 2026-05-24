## GitHub Issues

- #186
- #188 (Step 1 — Party data model refactor, completed prerequisite)

## Why

- Problem statement: The `/campaigns` page is a pure management list (create/edit/delete). A DM has no at-a-glance view of where they are in their campaign — who's in the party, what chapter they're on, or what happened last session.
- Why now: All blockers are cleared. The Party data model refactor (#188 Step 1) is complete (`members: PartyMember[]` replaces `characterIds`). Campaign Management (#182) and Travelling NPCs (#183) are done. The necessary APIs (`/api/parties`, `/api/characters`, `/api/campaigns/[id]/sessions`) all exist.
- Business/user impact: DMs currently have to navigate to separate pages (Parties, Characters) to reconstruct a mental picture of their campaign state before each session. The dashboard gives them that picture immediately on the most-visited page.

## Problem Space

- Current behavior: `/campaigns/page.tsx` fetches only campaigns and global templates. It renders a management list — no party data, no character roster, no session history.
- Desired behavior: The top of the page shows a dashboard section for every active campaign, each with party roster (PCs and NPCs grouped), current chapter, and (when available) the most recent session log entry. The existing management list remains below, unchanged.
- Constraints:
  - `CharacterMiniSummary` must not be modified — it is the combat-view component and owns AC/HP display. The dashboard uses a new `CharacterRosterCard` (name, race, class/level, type badge — no combat stats).
  - `CampaignChapterInfo` does not yet exist and must be created.
  - Data joins are client-side only — no new API endpoints.
  - Last Session card is non-blocking: it loads after the main render via a secondary `useEffect` and is absent if no session data exists.
- Assumptions:
  - All parties and characters for a user are small enough that fetching all and filtering client-side is acceptable (consistent with the existing app pattern).
  - A campaign's `active` flag is the source of truth for dashboard inclusion.
  - Between sessions, characters always have full HP — the roster view intentionally omits HP/AC to avoid showing stale combat state.
- Edge cases considered:
  - No active campaigns → CTA card, no campaign cards rendered.
  - Active campaign with no linked party → empty state with link to `/parties`.
  - Active campaign with multiple parties → one party sub-card per party.
  - Party with no active members (all `leftAt` set) → renders as empty party.
  - Session API returns empty → Last Session card simply absent.

## Scope

### In Scope

- New `CharacterRosterCard` component (`lib/components/CharacterRosterCard.tsx`) — name, race, class/level, NPC/Companion badge. No AC/HP.
- New `CampaignChapterInfo` component (`lib/components/CampaignChapterInfo.tsx`) — renders module name and current chapter from `Campaign.chapters` + `Campaign.currentChapterId`.
- Extend `app/campaigns/page.tsx`: parallel `Promise.all` fetch for campaigns + parties + characters; secondary `useEffect` for per-campaign session data; Active Campaigns dashboard section above the management list.
- Tests: unit tests for both new components and dashboard section logic; integration smoke test.

### Out of Scope

- Modifying `CharacterMiniSummary` or `CombatStatsRow`.
- New API endpoints — all data comes from existing routes.
- Prompt Builder or Encounter quick-action routing changes (buttons link to existing routes `/prompts` and `/encounters` as-is).
- Session log creation UI (that's #188 Steps 3–4).
- Any change to `app/page.tsx` (stays as redirect to `/campaigns`).

## What Changes

- `lib/components/CharacterRosterCard.tsx` — new component
- `lib/components/CampaignChapterInfo.tsx` — new component
- `app/campaigns/page.tsx` — extended fetching, new dashboard section UI
- Test files for the above

## Risks

- Risk: Large character or party lists cause slow initial render.
  - Impact: Low — user data sets are expected to be small; consistent with existing app patterns.
  - Mitigation: Client-side filtering only; no additional round trips for the main render path.
- Risk: Session fetch for each active campaign fires N parallel requests.
  - Impact: Low for typical campaign counts (1–3). Could be noticeable with many active campaigns.
  - Mitigation: Secondary `useEffect` fires after main render so it never blocks the page. Cap or batch if counts grow.
- Risk: `CampaignChapterInfo` renders incorrectly if `currentChapterId` references a missing chapter.
  - Impact: Low — graceful fallback to "No chapter set".
  - Mitigation: Defensive lookup in the component.

## Open Questions

No unresolved ambiguity. All architectural decisions were confirmed during the explore session:
- CharacterRosterCard (Option B, no combat stats) — confirmed.
- CampaignChapterInfo as a new component — confirmed.
- Client-side joins, no new API endpoints — confirmed.
- Last Session card lazy and conditional — confirmed.

## Non-Goals

- Replacing or merging the campaign management list below the dashboard.
- Real-time HP/AC tracking between sessions.
- Combat event auto-capture in session logs (deferred to #190).
- A "pick one active campaign" mechanic — all active campaigns are shown.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
