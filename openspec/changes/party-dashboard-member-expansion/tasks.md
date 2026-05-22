# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/party-dashboard-member-expansion` then immediately `git push -u origin feature/party-dashboard-member-expansion`

## Execution

### 1. Create `CombatStatsRow` component

- [x] Create `lib/components/CombatStatsRow.tsx` with props `{ ac: number; acNote?: string; hp: number; maxHp: number }`
- [x] Extract the AC/HP grid JSX from `lib/components/CreatureStatBlock.tsx` (lines ~64–78) into `CombatStatsRow` — identical Tailwind classes, no visual change
- [x] Export `CombatStatsRow` from the new file

### 2. Refactor `CreatureStatBlock` to use `CombatStatsRow`

- [x] Import `CombatStatsRow` into `lib/components/CreatureStatBlock.tsx`
- [x] Replace the inline AC/HP grid block with `<CombatStatsRow ac={ac} acNote={acNote} hp={hp} maxHp={maxHp} />`
- [x] Confirm all other props and rendering logic in `CreatureStatBlock` are untouched
- [x] Verify no visual change by running existing unit tests: `npm run test:unit -- --testPathPattern="CreatureStatBlock"`

### 3. Create `CharacterMiniSummary` component

- [x] Create `lib/components/CharacterMiniSummary.tsx` with props:
  ```ts
  {
    name: string;
    race?: string;
    characterType?: CharacterType;
    classes?: CharacterClass[];
    ac: number;
    hp: number;
    maxHp: number;
  }
  ```
- [x] Render name prominently; render NPC/Companion badge when `characterType` is `'npc'` or `'companion'`
- [x] Render identity line: `{race ?? '—'} · {className} · Lv {totalLevel}` — omit class/level line if `classes` is empty
- [x] Compute `totalLevel` as `classes?.reduce((sum, c) => sum + (c.level ?? 0), 0) ?? 0`
- [x] Render `<CombatStatsRow ac={ac} hp={hp} maxHp={maxHp} />` for the stats row
- [x] Handle all fallback cases: undefined race → "—"; empty classes → no class/level line

### 4. Update party list card in `app/parties/page.tsx`

- [x] Import `CharacterMiniSummary`, `CHARACTER_TYPE_ORDER`, `CHARACTER_TYPE_LABELS`, `getCharacterType` (already imported — verify)
- [x] In the party card render (inside `parties.map(...)`), replace the `getCharacterNames()` text block with:
  - A lookup of full character objects for `party.characterIds`
  - `CHARACTER_TYPE_ORDER.map(type => ...)` — filter, skip empty groups (return `null`), render section label + grid of `CharacterMiniSummary` cards
- [x] Preserve existing Edit/Delete buttons and campaign/description display
- [x] Preserve existing zero-member empty state

### 5. Write unit tests

- [x] `tests/unit/CombatStatsRow.test.tsx` — covers: AC/HP render, acNote present/absent
- [x] `tests/unit/CharacterMiniSummary.test.tsx` — covers: full render, NPC badge, Companion badge, no badge for PC, multiclass level sum, undefined race fallback, empty classes fallback
- [x] `tests/unit/components/PartiesPage.test.tsx` (extend existing or add) — covers: all-three-types party renders three sections, PC-only party hides NPC/Companion sections, zero-member party shows no sections, member with undefined characterType defaults to PC section, comma list no longer rendered

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration`
- [x] Run type check: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] Run lint: `npm run lint`
- [x] All tasks in Execution marked complete
- [x] All steps in Remote push validation below pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Lint / type check** — `npm run lint` and `npx tsc --noEmit` — no errors

If **ANY** of the above fail, iterate and fix before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review before committing
- [ ] Commit all changes to `feature/party-dashboard-member-expansion` and push to remote
- [ ] Open PR from `feature/party-dashboard-member-expansion` to `main` with title: `feat: party dashboard member expansion (closes #195)`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, run all validation steps, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once all blocking review comments are resolved
- [ ] **Monitor CI checks** — fix any failures, commit, validate locally, push; repeat until all checks pass
- [ ] Wait for the PR to merge — **never force-merge**; if a human force-merges, proceed to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/`:
  - Copy `specs/combat-stats-row/spec.md` → `openspec/specs/combat-stats-row/spec.md`
  - Copy `specs/character-mini-summary/spec.md` → `openspec/specs/character-mini-summary/spec.md`
  - Merge `specs/party-member-expansion/spec.md` additions into `openspec/specs/party-member-expansion/spec.md` (create if absent)
- [ ] Archive the change: move `openspec/changes/party-dashboard-member-expansion/` to `openspec/changes/archive/2026-05-22-party-dashboard-member-expansion/` — stage both copy and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/2026-05-22-party-dashboard-member-expansion/` exists and `openspec/changes/party-dashboard-member-expansion/` is gone
- [ ] Commit and push the archive commit to `main`
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d feature/party-dashboard-member-expansion`
