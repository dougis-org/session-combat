## Context

- Relevant architecture: Next.js App Router project. Component files live under `app/<route>/`. Shared/library components live under `lib/components/`. Unit tests live under `tests/unit/components/` (for standalone components) and `tests/unit/` (legacy, being migrated by convention).
- Dependencies: `MonsterTemplateEditor` depends on `CreatureStatsForm`, `AlignmentSelect`, `EditorShell` (from `lib/components/ui.tsx`), and `normalizeAlignment` (utility). `MonsterTemplateCard` has no library dependencies beyond Tailwind classes.
- Interfaces/contracts touched: `app/monsters/page.tsx` (consumer of both extracted components). No API or shared-library contracts change.

## Goals / Non-Goals

### Goals

- Split `MonsterTemplateEditor` and `MonsterTemplateCard` into named-export files following repo convention
- Rename the ambiguously-named inline `normalizeSpeed` helper to `formatSpeedValue`
- Add a unit test file for `MonsterTemplateEditor`
- Move the existing page test to the canonical `tests/unit/components/` location

### Non-Goals

- Any behavioral change to the extracted components
- Merging or deduplicating `formatSpeedValue` with `lib/import/transformMonster.ts:normalizeSpeed`
- Adding tests for `MonsterTemplateCard`

## Decisions

### Decision 1: Extract MonsterTemplateCard to its own file

- Chosen: `app/monsters/MonsterTemplateCard.tsx` as a named export
- Alternatives considered: Keep co-located inside `MonsterTemplateEditor.tsx` or remain in `page.tsx`
- Rationale: `MonsterTemplateCard` is used by `MonstersContent` (the page), not by `MonsterTemplateEditor`. It is a sibling, not a child. Repo convention (established by `app/campaigns/CampaignEditor.tsx` pattern) extracts to own file.
- Trade-offs: One more file; no meaningful downside given it is ~85 lines.

### Decision 2: Rename inline normalizeSpeed to formatSpeedValue

- Chosen: Rename to `formatSpeedValue` inside `MonsterTemplateEditor.tsx`
- Alternatives considered: Reuse `lib/import/transformMonster.ts:normalizeSpeed`; keep the name as-is
- Rationale: The two functions accept different input shapes. The import version takes `Open5ECreature["speed"]` (a structured API object); the editor version takes `unknown` and handles pass-through for already-stored strings. Using the import version in the editor would create a cross-layer dependency and break on string inputs. Keeping the same name risks confusion for future readers.
- Trade-offs: Slight duplication of speed-normalization logic; acceptable since the use-cases are genuinely different.

### Decision 3: Move monstersPage test to tests/unit/components/

- Chosen: `tests/unit/components/MonstersPage.test.tsx`
- Alternatives considered: Leave in `tests/unit/`
- Rationale: All other component tests live in `tests/unit/components/`. The existing location is a legacy holdout.
- Trade-offs: git history for the test file is severed at the move point (acceptable for a rename).

## Proposal to Design Mapping

- Proposal element: Extract `MonsterTemplateEditor`
  - Design decision: Decision 1 (own file), Decision 2 (rename helper)
  - Validation approach: TypeScript build passes; all existing tests pass; new unit test added
- Proposal element: Extract `MonsterTemplateCard`
  - Design decision: Decision 1
  - Validation approach: TypeScript build passes; page test still passes
- Proposal element: Rename `normalizeSpeed` → `formatSpeedValue`
  - Design decision: Decision 2
  - Validation approach: `grep -r "normalizeSpeed" app/monsters/` returns no results after rename
- Proposal element: Move `monstersPage.test.tsx`
  - Design decision: Decision 3
  - Validation approach: Test count for monsters-related tests unchanged before/after move

## Functional Requirements Mapping

- Requirement: `MonsterTemplateEditor` renders and saves correctly after extraction
  - Design element: Named export in `app/monsters/MonsterTemplateEditor.tsx`
  - Acceptance criteria reference: specs/monster-template-editor-extraction/spec.md
  - Testability notes: `MonsterTemplateEditor.test.tsx` covers render, validation (empty name), async save success, and cancel
- Requirement: `MonsterTemplateCard` renders correctly after extraction
  - Design element: Named export in `app/monsters/MonsterTemplateCard.tsx`
  - Acceptance criteria reference: specs/monster-template-editor-extraction/spec.md
  - Testability notes: Covered indirectly by existing `MonstersPage.test.tsx`
- Requirement: `page.tsx` remains functionally identical
  - Design element: page.tsx imports from new files, all existing behaviour preserved
  - Acceptance criteria reference: existing `MonstersPage.test.tsx` must pass unchanged
  - Testability notes: No modifications to test file content, only its path changes

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regressions in CI after extraction
  - Design element: Pure structural refactor; no logic changes
  - Acceptance criteria reference: All existing `monstersPage` / `monsters-filter` tests pass
  - Testability notes: Run `jest --testPathPattern=monsters` before/after; compare output

## Risks / Trade-offs

- Risk/trade-off: `formatSpeedValue` helper diverges further from the import-pipeline version over time
  - Impact: Two implementations to maintain
  - Mitigation: A comment in `MonsterTemplateEditor.tsx` notes the divergence and points to `lib/import/transformMonster.ts:normalizeSpeed` for context. Issue #379 consolidation may be the right moment to unify if input shapes converge.

## Rollback / Mitigation

- Rollback trigger: CI failures that cannot be fixed within the PR
- Rollback steps: Revert the PR; `page.tsx` still has all component definitions at that point
- Data migration considerations: None — pure code restructure, no data model changes
- Verification after rollback: `jest --testPathPattern=monsters` passes; TypeScript build passes

## Operational Blocking Policy

- If CI checks fail: Fix before merging — this is a refactor with no intended behaviour change, so any failure is a real regression
- If security checks fail: Investigate; no new network calls or auth paths are introduced by this change so a security failure would indicate an unrelated issue
- If required reviews are blocked/stale: Re-request after 48 hours; escalate to project maintainer
- Escalation path and timeout: Tag maintainer after 48 hours of no review response

## Open Questions

No open questions. All decisions confirmed during proposal/explore phase.
