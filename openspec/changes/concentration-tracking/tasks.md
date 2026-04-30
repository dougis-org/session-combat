# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feature/concentration-tracking` then immediately `git push -u origin feature/concentration-tracking`

## Execution

### 1. Add concentration field to CombatantState type

- [ ] Add `concentrationSpell?: string` to `CombatantState` interface in `lib/types.ts`
- [ ] Update any type references if needed

### 2. Add concentration state management in CombatantCard

- [ ] Add `concentrationDc` state (displays DC badge) to `CombatantCard`
- [ ] Wire `concentrationSpell` into the combatant row display
- [ ] Add "End Concentration" button next to concentration indicator
- [ ] Handle [End] click: clear `concentrationSpell`, show toast

### 3. Add DC badge display logic

- [ ] In `CombatantCard.adjustHp()`, after damage is calculated:
  - Check if `combatant.concentrationSpell` is set
  - Calculate DC: `dc = Math.max(10, Math.floor(rawDamage / 2))`
  - Set `concentrationDc` state with `{ dc, damage: rawDamage }`
- [ ] Render DC badge in combatant row when `concentrationDc` is set: `⚠️ DC {dc} (took {damage} dmg)`

### 4. Add auto-clear on 0 HP logic

- [ ] In `adjustHp()`, after damage application:
  - If result HP === 0 and `combatant.concentrationSpell` is set
  - Clear `concentrationSpell`
  - Show toast: "[Name] lost concentration on [Spell]"
  - Clear `concentrationDc` badge

### 5. Clear DC badge on turn advance

- [ ] In `nextTurn()` function in `CombatantContent`:
  - Reset `concentrationDc` state for all combatants (or track per-combatant)
  - Consider: store `concentrationDc` per-combatant in a Map or pass through `updateCombatant`

### 6. Add concentration field to detail popup

- [ ] In the detail popup JSX (inside `CombatantCard`):
  - Add "Concentration" label and text input field
  - Field always visible (not conditional on focus)
  - On change: call `onUpdate({ concentrationSpell: value })`

### 7. Add toast notification support

- [ ] Verify existing toast state mechanism in `CombatantContent`
- [ ] If not present, add toast state: `{ message: string, type: 'success' | 'error' }`
- [ ] End concentration toast: `"[Name] ended concentration on [Spell]"`
- [ ] Auto-clear toast: `"[Name] lost concentration on [Spell]"`

## Validation

- [ ] Run unit tests: `npm test -- --testPathPattern="combat"` — all pass
- [ ] Run type checks: `npm run typecheck` — no errors
- [ ] Run build: `npm run build` — succeeds
- [ ] Manual verification: Open combat, set concentration on a combatant, deal damage, verify DC badge appears, advance turn, verify badge clears

All completed tasks marked as complete.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run `npm test -- --testPathPattern="combat"`; all must pass
- **Type checks** — run `npm run typecheck`; no errors
- **Build** — run `npm run build`; must succeed with no errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feature/concentration-tracking` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, validate locally, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix, commit, validate locally, push, wait 180 seconds, repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: AI agent (human review before merge)
- Reviewer(s): Human reviewer required
- Required approvals: 1 (human approval)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/`
- [ ] Archive the change: move `openspec/changes/concentration-tracking/` to `openspec/changes/archive/YYYY-MM-DD-concentration-tracking/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-concentration-tracking/` exists and `openspec/changes/concentration-tracking/` is gone
- [ ] Commit and push the archive to main in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d feature/concentration-tracking`