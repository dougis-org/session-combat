## GitHub Issues

- #761

## Why

- Problem statement: `lib/components/ActiveCombatView.tsx` (511 lines) and `tests/e2e/combat.spec.ts` (834 lines) have been flagged repeatedly by Verity's comprehensibility gate (PRs #702, #756) as too large to review coherently.
- Why now: the gate has now flagged the same two files across multiple unrelated PRs; the risk was already logged as a pre-existing MEDIUM finding in `openspec/changes/archive/2026-09-17-auto-scroll-next-combatant/design.md`, and letting it compound makes every future PR touching these files harder to review.
- Business/user impact: none directly — this is a maintainability/review-quality fix, not a behavior change. Indirect benefit: faster, safer review cycles for future combat-view and combat-e2e work.

## Problem Space

- Current behavior: `ActiveCombatView.tsx` owns initiative-modal anchoring/dismissal (~120 lines: `getCardAnchorPosition`, `openInitiativeModal`, `handleSetInitiative`, `closeInitiativeModal`, three effects for auto-open/removal-race/viewport-clamp), the CON-save notification handler (~15 lines), plus rendering for the header, initiative list, and all setup/active modals forwarded to `CombatSetupAndActiveModals`. `tests/e2e/combat.spec.ts` covers D&D Beyond import, character/party/encounter creation, core combat screen + HP, legendary actions, lair actions, and the full end-to-end flow, all as one file, reusing `tests/e2e/helpers/{actions,db,isolation}.ts`.
- Desired behavior: both files are split along their existing seams so each resulting file is small enough to review coherently, with zero change to runtime or test behavior.
- Constraints: no behavior change — this is issue #761's explicit acceptance criterion. All existing unit and e2e coverage must continue to pass unchanged. Must not collide with any other in-flight change touching these files (checked: `auto-scroll-next-combatant` is archived; `campaign-nav-fix-and-encounter-tests` was abandoned by the user — no other in-progress change references either file).
- Assumptions: the initiative-modal logic can be extracted into a hook (`useInitiativeModal`) that takes `combat: UseCombatReturn` plus the minimal props it needs, mirroring the precedent set by the `combatant-card-decomposition` capability (#702). The e2e spec splits cleanly along the existing `test.describe` groupings without needing new fixtures beyond what `tests/e2e/helpers/` already provides.
- Edge cases considered: the initiative-modal hook must preserve the exact effect-dependency behavior documented in code comments (e.g., excluding `combatState` from the auto-open effect's deps to avoid HP-update races, the removal-race recovery effect, viewport-scroll-aware clamping). Splitting the e2e spec must preserve any shared `beforeEach`/setup state and not silently drop coverage during the split.

## Scope

### In Scope

- Extract initiative-modal anchoring/dismissal/auto-open logic from `ActiveCombatView.tsx` into a dedicated hook (e.g. `lib/hooks/useInitiativeModal.ts`) or subcomponent.
- Evaluate extracting the CON-save notification handler alongside it if it meaningfully shrinks the main component; otherwise leave in place (it's already only ~15 lines).
- Evaluate extracting remove/detail popup wiring; only pursue if it reduces real complexity rather than just relocating lines (per issue's own hedge: "possibly").
- Split `tests/e2e/combat.spec.ts` into feature-area files (e.g. `combat-import.spec.ts`, `combat-legendary.spec.ts`, `combat-lair.spec.ts`, `combat-turn-order.spec.ts`, and a remaining core/HP file), reusing `tests/e2e/helpers/`.
- Verify both resulting file sets pass Verity's file-length/comprehensibility gate.

### Out of Scope

- Any change to combat behavior, UI, or test assertions/outcomes.
- Decomposing `CombatSetupAndActiveModals.tsx` or other already-reasonably-sized components.
- Introducing new test coverage — this is reorganization only.
- Changing `tests/e2e/helpers/` contracts (may reuse, not restructure, unless splitting the spec requires a trivial extraction).

## What Changes

- New file(s) under `lib/hooks/` (or similar) housing initiative-modal state/effects, imported and used by `ActiveCombatView.tsx`.
- `ActiveCombatView.tsx` shrinks to primarily render/compose logic plus whatever thin wiring doesn't warrant its own module.
- `tests/e2e/combat.spec.ts` is replaced by multiple smaller spec files grouped by feature area; the original file is removed once its tests are fully migrated.
- No changes to `lib/hooks/useCombat.ts`, `CombatSetupAndActiveModals.tsx`, or any other component's public behavior.

## Risks

- Risk: extracting the initiative-modal hook subtly changes effect timing (e.g. dependency arrays) and reintroduces a race the current comments describe as deliberately avoided.
  - Impact: initiative modal could fail to auto-open, auto-reopen when it shouldn't, or crash on combatant removal.
  - Mitigation: preserve all documented effect-dependency rationale verbatim in the extracted hook; run full existing e2e initiative/turn-order coverage after extraction with no assertion changes.
- Risk: splitting `combat.spec.ts` drops or duplicates setup/teardown state shared across the original `test.describe` block.
  - Impact: flaky or silently-skipped e2e coverage.
  - Mitigation: mechanical split by existing `test.describe`/`test(...)` boundaries, run the full e2e suite before/after to diff pass/fail counts.
- Risk: Verity's size gate still flags one of the resulting files if the split isn't fine-grained enough.
  - Impact: change doesn't fully satisfy the issue's acceptance criteria.
  - Mitigation: check file sizes against the gate's threshold before finalizing tasks; split further if needed.

## Open Questions

- None blocking. Prior exploration (this session, explore mode) already resolved conflict-checking against other in-flight changes (both `auto-scroll-next-combatant` and `campaign-nav-fix-and-encounter-tests` are no longer live) and the user has explicitly instructed proceeding to implementation.

## Non-Goals

- Achieving a specific "ideal" component architecture beyond what's needed to pass the size gate.
- Refactoring `CombatantCard` further (already decomposed in #702).
- Adding new tests or improving coverage beyond the 1:1 migration of existing assertions.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
