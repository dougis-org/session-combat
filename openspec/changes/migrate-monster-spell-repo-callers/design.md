## Context

- Relevant architecture: `lib/storage.ts` is a legacy god-object facade (Epic #499) being decomposed into per-domain repo modules under `lib/storage/*Repo.ts`. `lib/storage/monsterTemplateRepo.ts` and `lib/storage/spellRepo.ts` already implement the full Monster/Spell Template behavior; `lib/storage.ts:81-222` currently just forwards to them 1:1.
- Dependencies: none new. `lib/storage/monsterTemplateRepo.ts` and `lib/storage/spellRepo.ts` are already implemented, tested, and stable (confirmed via source inspection -- no missing methods).
- Interfaces/contracts touched: import statements and call-site prefixes in 9 files (listed in proposal.md Scope). Method names, signatures, return types, and error behavior are unchanged -- the underlying implementation being called is identical (the facade methods are pure pass-throughs).

## Goals / Non-Goals

### Goals

- Every listed caller imports `monsterTemplateRepo` and/or `spellRepo` directly instead of `storage`.
- Zero behavior change: same inputs produce the same outputs, same errors, same side effects.
- Test files that specifically exercise Monster/Spell Template behavior through the `storage` facade are updated so they still cover the code path that production now actually calls.

### Non-Goals

- Removing the delegation methods from `lib/storage.ts` (out of scope per proposal.md; deferred until all #499 domains are migrated).
- Touching any other `storage` domain or any file outside the listed 9 production files + their directly-coupled tests.
- Changing method signatures, validation, or error handling in `monsterTemplateRepo.ts` / `spellRepo.ts`.

## Decisions

### Decision 1: Import repo modules with namespace imports, matching the existing facade's own import style

- Chosen: `import * as monsterTemplateRepo from "@/lib/storage/monsterTemplateRepo"` and/or `import * as spellRepo from "@/lib/storage/spellRepo"`, mirroring exactly how `lib/storage.ts` itself imports these modules (`lib/storage.ts:40,47`).
- Alternatives considered: named imports of individual functions (e.g. `import { saveMonsterTemplate } from ...`).
- Rationale: Namespace import keeps the call-site diff minimal (`storage.saveMonsterTemplate(...)` -> `monsterTemplateRepo.saveMonsterTemplate(...)`, a pure find/replace of the prefix) and matches the pattern every other migrated `storage.ts` domain in this codebase already follows (per project memory: session-log/share/spell/roll clusters were migrated the same way in #503/#504). Reduces review risk versus rewriting each call as a named import.
- Trade-offs: Slightly more verbose call sites (`monsterTemplateRepo.` vs a bare function name) -- accepted, consistent with codebase convention.

### Decision 2: One-file-at-a-time mechanical replacement, no shared helper/abstraction introduced

- Chosen: Each of the 9 files gets its `storage` import replaced with the specific repo import(s) it needs, and each `storage.<method>` call site is replaced with `<repo>.<method>`. No new module, wrapper, or re-export is introduced.
- Alternatives considered: Introducing an intermediate barrel module re-exporting both repos as one object to minimize per-file edits.
- Rationale: The task is explicitly mechanical (proposal.md "What Changes"). A barrel/wrapper would recreate the same god-object problem this migration is meant to reduce. Direct imports are the end state Epic #499 is working toward.
- Trade-offs: `lib/import/dedupeEngine.ts` needs two imports instead of one -- acceptable, it already calls into two domains.

### Decision 3: Update only tests that couple to the `storage` facade for these specific methods, leave other tests untouched

- Chosen: `tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage.characterization.test.ts`, `tests/unit/import/dedupeEngine.test.ts`, and `tests/unit/api/monsters/upload.route.test.ts` are inspected for `jest.mock('@/lib/storage', ...)` or direct `storage.<method>` assertions tied to Monster/Spell Template behavior, and updated to mock/import the narrow repos instead, matching what production code now imports.
- Alternatives considered: Leaving tests as-is since they'd still pass (the facade still exists and still delegates correctly).
- Rationale: If left as-is, these tests would keep mocking `storage` while production code no longer calls it -- the mock would go unused and the test would pass without exercising the actual import path production uses, silently reducing effective coverage (a risk called out explicitly in proposal.md).
- Trade-offs: Slightly larger diff than pure production-code migration, but required to keep test coverage meaningful.

## Proposal to Design Mapping

- Proposal element: 9 production files migrate from `storage` to narrow repo imports
  - Design decision: Decision 1 (namespace import matching facade style), Decision 2 (mechanical per-file replacement)
  - Validation approach: TypeScript compilation (`tsc --noEmit`) catches any missed/mistyped call; full Jest suite run confirms behavior parity
- Proposal element: Tests coupled to `storage` facade for Monster/Spell Template behavior are updated
  - Design decision: Decision 3
  - Validation approach: Run the specific updated test files and confirm they still pass and still assert against real call paths (verify mocks target `monsterTemplateRepo`/`spellRepo`, not stale `storage` mocks)
- Proposal element: `lib/storage.ts` delegation code and `lib/storage/campaignTemplateRepo.ts` are explicitly out of scope
  - Design decision: N/A -- no design decision needed, these files are untouched by this change
  - Validation approach: `git diff` review before merge confirms no edits to `lib/storage.ts` or `lib/storage/campaignTemplateRepo.ts`

## Functional Requirements Mapping

- Requirement: Each of the 9 files must call the correct repo method with unchanged arguments and unchanged return handling
  - Design element: Decision 1, Decision 2
  - Acceptance criteria reference: specs (per-file caller migration requirements)
  - Testability notes: Existing unit/integration tests for each API route (e.g. `tests/unit/api/monsters/*`, `tests/unit/api/spells/*`) already assert request/response behavior; they must pass unmodified after the import swap, since the underlying implementation is identical
- Requirement: No other `storage` domain or unrelated file is touched
  - Design element: Non-Goals, Proposal Scope (Out of Scope)
  - Acceptance criteria reference: specs (scope boundary requirement)
  - Testability notes: Diff review -- file list must exactly match proposal.md's "In Scope" list

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Zero behavior/regression risk from the migration
  - Design element: Decision 2 (no abstraction introduced, pure prefix swap)
  - Acceptance criteria reference: specs (no-behavior-change requirement)
  - Testability notes: Full test suite (`npm test` / project's Jest command) must be green before and after with no test file changes beyond the ones listed in Decision 3
- Requirement category: maintainability
  - Requirement: Test coverage continues to reflect the actual import path used by production code
  - Design element: Decision 3
  - Acceptance criteria reference: specs (test-coupling requirement)
  - Testability notes: Manual inspection of updated mock targets in the 4 identified test files

## Risks / Trade-offs

- Risk/trade-off: A call site is missed, leaving a stray `storage.<method>` call alongside the new imports.
  - Impact: Either a lint/type error (if `storage` import is removed but a call remains) or a silent live coupling to the facade that defeats the purpose of the migration (if `storage` import is kept "just in case").
  - Mitigation: Remove the `storage` import entirely from each migrated file as the last step for that file -- TypeScript will fail to compile if any `storage.` reference remains, making a missed call site a build error rather than a silent gap.
- Risk/trade-off: Two similarly-named repo modules (`monsterTemplateRepo`, `spellRepo`) increase the chance of copy-paste mapping a method to the wrong one in `dedupeEngine.ts`, the one file that needs both.
  - Impact: Runtime `TypeError: <repo>.<method> is not a function`.
  - Mitigation: The exact method-to-repo mapping is enumerated in proposal.md's "Current behavior" bullet; tasks.md will list each call site's target repo explicitly rather than leaving it to inference during implementation.

## Rollback / Mitigation

- Rollback trigger: Test suite failure after migration that isn't resolved within the same implementation session, or a runtime error surfaced in manual verification of the affected API routes (`/api/monsters*`, `/api/spells*`).
- Rollback steps: Since this change is import-path-only and additive test updates, `git revert` of the change's commit(s) on the feature branch fully restores prior behavior -- `lib/storage.ts`'s facade methods are untouched and remain fully functional, so reverting the 9 caller files is safe and self-contained.
- Data migration considerations: None -- no data model, schema, or persisted-data change is involved.
- Verification after rollback: Re-run the full test suite and confirm the 9 files show `storage.` call sites again matching pre-change state.

## Operational Blocking Policy

- If CI checks fail: Fix the specific failing test/lint/type error before merge; given the mechanical nature of this change, a CI failure almost certainly indicates a missed or mis-mapped call site (see Risks) -- treat it as a correctness bug, not a flaky/unrelated failure, unless investigation proves otherwise.
- If security checks fail (Codacy/Verity): No new security-relevant surface is introduced (no new I/O, no new external calls, no new user input handling) -- investigate as a false positive first, but do not waive without root-causing, per project waive policy (CLAUDE.md: waives require a cited human-approved source, never used to bypass a block).
- If required reviews are blocked/stale: Given the low-risk, mechanical nature of the change, ping the reviewer directly; do not bypass branch protection or use admin merge (per project feedback memory: no admin merge bypass, no branch protection bypass).
- Escalation path and timeout: If blocked more than one business day with no reviewer response, flag to the user/issue owner (#686, assigned per proposal's change-control note) rather than proceeding unapproved.

## Open Questions

- None -- proposal.md's Open Questions section confirms no unresolved ambiguity; this design follows directly from the resolved proposal.
