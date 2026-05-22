# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b extract-dndbeyond-identity` then immediately `git push -u origin extract-dndbeyond-identity`
- [x] **Grep import sites:** `grep -rn "parseDndBeyondCharacterUrl\|normalizeAlignment" --include="*.ts" .` — record any files outside `lib/dndBeyondCharacterImport.ts` that import these names

## Execution

- [x] **Create `lib/import/dndBeyond-identity.ts`** — new file with:
  - Private constants: `CANONICAL_HOST`, `CHARACTER_PATH_PATTERN`, `ALIGNMENT_ID_MAP`
  - Private interface: `CharacterIdentity`
  - Private helpers (not exported): `parseUrlOrThrow`, `isSupportedDndBeyondHostname`
  - Exported functions: `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, `normalizeAlignmentId`
  - Imports needed: `createValidationError`, `DndBeyondImportError` from `./dndBeyond-utils`; `DnDAlignment` from `../types`; `DndBeyondCharacterData`, `NormalizedCharacterDetails` from `../dndBeyondCharacterImport` (or inline the minimal types if circular — evaluate during implementation)

- [x] **Update `lib/dndBeyondCharacterImport.ts`:**
  - Add import from `./import/dndBeyond-identity`: `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, `normalizeAlignmentId`
  - Remove inline definitions of: `parseUrlOrThrow`, `isSupportedDndBeyondHostname`, `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, `normalizeAlignment`
  - Remove private constants: `CANONICAL_HOST`, `CHARACTER_PATH_PATTERN`, `ALIGNMENT_ID_MAP`
  - Remove `CharacterIdentity` interface
  - Rename all call sites: `normalizeAlignment(...)` → `normalizeAlignmentId(...)`
  - If `parseDndBeyondCharacterUrl` was re-exported from this file, add: `export { parseDndBeyondCharacterUrl } from "./import/dndBeyond-identity"` (only if grep from Preparation found external consumers)

- [x] **Resolve circular dependency risk:** If `dndBeyond-identity.ts` needs `DndBeyondCharacterData` or `NormalizedCharacterDetails` from `dndBeyondCharacterImport.ts`, extract those types to `lib/import/dndBeyond-types.ts` or inline minimal structural types — do not create a circular import.

- [x] **Verify grep is clean:** `grep -n "function parseUrlOrThrow\|function isSupportedDndBeyondHostname\|function requireCharacterIdentity\|function buildNormalizationWarnings\|function normalizeAlignment\b" lib/dndBeyondCharacterImport.ts` — must return empty

## Validation

- [x] `tsc --noEmit` — zero errors
- [x] `npm test` (or project test command) — all tests pass, zero test file modifications
- [x] `grep -n "normalizeAlignment[^I]" lib/dndBeyondCharacterImport.ts lib/import/dndBeyond-identity.ts` — must return empty (confirms rename is complete; `normalizeAlignmentId` won't match)
- [x] `grep -rn "from.*dndBeyondCharacterImport" --include="*.ts" .` — confirm no external consumer has lost its import
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation] pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `tsc --noEmit`; must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [x] Run the required pre-PR self-review before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `extract-dndbeyond-identity` to `main` — title: `refactor: Extract alignment and character identity helpers into dndBeyond-identity.ts (closes #159)`
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each, commit fixes, follow Remote push validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — diagnose failures, fix, validate locally, push; repeat until all checks pass
- [x] Wait for PR to merge — never force-merge; if a human force-merges, continue to Post-Merge

Ownership metadata:

- Implementer: doug
- Reviewer(s): agentic reviewers + human
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (pure internal refactor)
- [x] Sync approved spec deltas into `openspec/specs/` if spec content was revised during review
- [x] Archive the change: move `openspec/changes/extract-dndbeyond-identity/` to `openspec/changes/archive/YYYY-MM-DD-extract-dndbeyond-identity/` — stage both the copy and deletion in a single commit, never split
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-dndbeyond-identity/` exists and `openspec/changes/extract-dndbeyond-identity/` is gone
- [x] Commit and push the archive to `main` in one commit
- [x] Prune merged local branch: `git fetch --prune` and `git branch -d extract-dndbeyond-identity`
