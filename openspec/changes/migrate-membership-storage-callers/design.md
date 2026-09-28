## Context

- Relevant architecture: `lib/storage.ts` is a legacy facade being decomposed (epic #499) into per-domain repo modules under `lib/storage/*Repo.ts`. `lib/storage/membershipRepo.ts` already exists and exports all 7 membership functions with unchanged signatures (verified against `docs/storage-refactor/issue-503-inventory-verification.md`). This change only rewrites *callers* — no repo-module code changes.
- Dependencies: `lib/storage/membershipRepo.ts` (target import), `lib/storage.ts` (facade being narrowed away from, still needed by non-membership calls in 7 files and by any caller not covered by this issue).
- Interfaces/contracts touched: none. Function names, parameters, return types, and thrown error types (`DuplicateMemberError`, `InvalidUserIdError`, `StorageError`) are identical whether reached via `storage.<method>` or `membershipRepo.<method>` — the facade methods are thin re-exports.

## Goals / Non-Goals

### Goals

- Every non-test call site that invokes one of the 7 membership methods imports it from `@/lib/storage/membershipRepo` instead of via `storage`.
- Files that also use non-membership storage methods keep a (narrowed) `storage` import for those calls only.
- All existing tests continue to pass with no behavioral assertions changed — only mock import paths are updated where they target the migrated functions.
- Zero remaining non-test, non-archived matches for `storage\.(addMember|updateMemberStatus|listMembersForCampaign|getMember|listInvitationsForUser|getUserById|getUsersByIds)\(` after the change.

### Non-Goals

- Changing `membershipRepo.ts`, `runStorageOp`, or error-handling behavior.
- Migrating any other storage domain (shares, parties, characters, rolls, campaign templates, campaigns).
- Removing membership methods from `lib/storage.ts` itself.

## Decisions

### Decision 1: Full vs. partial import swap, decided per file by whether other storage domains are used

- Chosen: For each of the 15 files, inspect all `storage.*` calls in that file. If every call is one of the 7 membership methods, remove the `storage` import entirely and add a named import from `membershipRepo`. If other-domain calls remain, keep the `storage` import and add the `membershipRepo` import alongside it, rewriting only the membership call sites.
- Alternatives considered: (a) leave mixed-domain files untouched and only migrate the 8 pure files — rejected because it doesn't satisfy the issue's acceptance criteria ("all Membership callers"); (b) migrate all domains touched by mixed files in one pass — rejected as out of scope creep beyond #685 and against the epic's domain-by-domain pattern already established by #503/#504.
- Rationale: keeps the change mechanical and reviewable — one domain, one PR, matching the precedent set by PRs #672/#673.
- Trade-offs: mixed-domain files get two import statements instead of one, which is slightly less clean than a single facade import, but this is the expected intermediate state throughout the whole facade decomposition and resolves naturally as later issues migrate the remaining domains in those same files.

### Decision 2: Named imports, not a namespace re-import

- Chosen: `import { getMember, listMembersForCampaign } from '@/lib/storage/membershipRepo';` (only the functions actually used in that file), called as bare functions (`getMember(...)` not `membershipRepo.getMember(...)`).
- Alternatives considered: `import * as membershipRepo from '@/lib/storage/membershipRepo'` to minimize call-site diffs (keeps `membershipRepo.getMember(...)` shape) — rejected because it's inconsistent with how the other already-migrated domains (content/reference clusters, #504) were called at their sites, and named imports make unused-import lint catch drift immediately.
- Rationale: matches existing convention in files that already import narrow repos (e.g. `shareRepo`, `rollRepo` imports elsewhere in the same files), keeps diffs minimal per call, and enables tree-shaking/lint-driven detection of orphaned imports.
- Trade-offs: renaming collisions are possible if a file already has a local variable/import named e.g. `getMember` from a different repo — none observed in the current inventory (`getMember` is unique to membership across the files in scope), but tasks must check import-name collisions per file before applying.

### Decision 3: `lib/storage/partyRepo.ts`'s internal `storage.getMember` call is migrated in this change

- Chosen: rewrite `partyRepo.ts` to import `getMember` from `./membershipRepo` (relative sibling import within `lib/storage/`) rather than through the facade.
- Alternatives considered: defer to `partyRepo`'s own future migration issue — rejected per proposal's resolved Open Question; it's mechanically identical work and reduces one more facade dependency now rather than leaving a known stale reference.
- Rationale: `partyRepo.ts` already lives inside `lib/storage/`, so a sibling import is more natural than reaching through the top-level facade, and it costs nothing extra to fix while the file is already being touched for the same underlying rename.
- Trade-offs: none identified — this is a strict simplification with no external API change (partyRepo's own exports and callers are untouched).

## Proposal to Design Mapping

- Proposal element: 8 pure-membership files get a full import swap.
  - Design decision: Decision 1 (full swap branch), Decision 2 (named imports).
  - Validation approach: run each file's existing unit tests; grep sweep confirms no `storage.<membershipMethod>(` remains in these files.
- Proposal element: 7 mixed-domain files get a partial import swap, keeping `storage` for other domains.
  - Design decision: Decision 1 (partial swap branch).
  - Validation approach: run each file's existing unit tests; confirm both imports (`storage` and `membershipRepo`) are used (no unused-import lint failures).
- Proposal element: `lib/storage/partyRepo.ts`'s internal `getMember` call included in scope.
  - Design decision: Decision 3.
  - Validation approach: `partyRepo.ts` unit tests pass; grep confirms `partyRepo.ts` no longer references `storage.getMember`.
- Proposal element: test mocks updated to match new import paths, including a test-file grep sweep beyond the enumerated 15 production files.
  - Design decision: Decision 2 (named imports make mock-target mismatches visible as "mock not called" failures).
  - Validation approach: tasks.md includes a repo-wide grep across `tests/**` for the 7 method names as a discovery step; any test mocking `storage.<membershipMethod>` for a migrated file is updated to mock `@/lib/storage/membershipRepo` instead.

## Functional Requirements Mapping

- Requirement: All 15 identified production files no longer call membership methods via `storage.*`.
  - Design element: Decision 1, Decision 2.
  - Acceptance criteria reference: proposal "In Scope" bullet 1; GitHub issue AC 1.
  - Testability notes: post-change grep for the method pattern across the repo (excluding tests, `.verity/.snapshot/`) must return zero production matches.
- Requirement: No behavior change — same functions, same errors, same call semantics.
  - Design element: Context (facade methods are thin re-exports); Decision 2 (direct named calls preserve exact signatures).
  - Acceptance criteria reference: GitHub issue AC "no behavior change"; proposal Non-Goals.
  - Testability notes: existing unit/integration tests for all 15 files must pass unmodified in assertions (only mock wiring may change).
- Requirement: Mixed-domain files retain correct, working access to their non-membership storage calls.
  - Design element: Decision 1 (partial swap).
  - Testability notes: existing tests covering the non-membership calls in those 7 files continue to pass; lint confirms both imports are used.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: The migration must not introduce a partial-file state where an import is added but a call site is missed, leaving a dangling unused import or a stray facade call.
  - Design element: Decision 1's per-file inspection step; tasks.md includes an explicit lint/typecheck run after each file.
  - Acceptance criteria reference: proposal Risks (unused-import risk).
  - Testability notes: `npm run lint` / `tsc --noEmit` (or project equivalent) run per-file or in a final sweep; CI must be green.
- Requirement category: operability
  - Requirement: The change must be trivially revertible if a regression surfaces post-merge, since it touches 15 files with no functional intent.
  - Design element: single, atomic PR scoped to import/call-site rewrites only (see Rollback below).
  - Testability notes: PR diff review confirms no logic changes beyond import lines and call-site rewrites.

## Risks / Trade-offs

- Risk/trade-off: Mixed-domain files (Decision 1, partial branch) carry two import statements for the storage layer during the transition period.
  - Impact: minor readability cost until the remaining domains in those files are migrated by later epic #499 issues.
  - Mitigation: accepted as the established, deliberate pattern from prior domain migrations (#503/#504); no action needed beyond noting it resolves naturally over time.
- Risk/trade-off: Test files not enumerated in the proposal's grep (only production `.ts`/`.tsx` searched, not run through the actual test runner's module graph) could still reference `storage.<membershipMethod>` mocks.
  - Impact: undetected stale mocks that never execute the real migrated path.
  - Mitigation: tasks.md mandates a dedicated `grep -rn` sweep across `tests/**` for the 7 method names before finishing, independent of the production-file list.

## Rollback / Mitigation

- Rollback trigger: CI failure (test or typecheck) traced to this change after merge, or a runtime error in a migrated code path in a deployed environment.
- Rollback steps: revert the single PR (`git revert <merge-commit>`); because the change only rewrites imports/call sites with no data or schema changes, a straight revert restores prior behavior with no follow-up cleanup required.
- Data migration considerations: none — no data, schema, or persisted-state changes are made by this change.
- Verification after rollback: re-run the full test suite on `main` post-revert to confirm the 15 files return to their pre-change (facade-only) state and previously-passing tests pass again.

## Operational Blocking Policy

- If CI checks fail: fix the failing file(s) directly (most likely an incomplete import swap or a missed mock update) before merging; do not waive or bypass the CI gate for this change since it's purely mechanical and any failure indicates an incomplete edit.
- If security checks fail: not expected (no new dependencies, no new I/O, no data handling changes); if a scanner flags something, treat as a false positive on the diff shape and investigate — do not suppress without root-causing.
- If required reviews are blocked/stale: given the low-risk, mechanical nature of this change, ping for re-review after 1 business day; do not use `--admin` or bypass branch protection (per project standing policy — see [[feedback_no_admin_merge]] / [[feedback_no_branch_protection_bypass]]).
- Escalation path and timeout: if blocked more than 2 business days, escalate to the repo owner (@dougis) directly, since this change has no external dependents and no urgency beyond epic #499 progress.

## Open Questions

- None remaining — both questions raised in the proposal were resolved there (partyRepo.ts's internal call is in scope; a test-file grep sweep is included in tasks rather than deferred).
