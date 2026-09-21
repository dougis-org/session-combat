## Context

- Relevant architecture: `lib/storage.ts` is a monolithic storage facade (subject of epic #499's ongoing decomposition). `lib/storage/characterRepo.ts` already exists as the narrow, domain-specific module for character persistence (`loadCharacters`, `loadCharacterById`, `saveCharacter`, `saveCharacters`, `deleteCharacter`), each wrapped in `runStorageOp` for consistent logging/error semantics. This change updates only the *caller side* — six `app/api/**` route files — to import from `characterRepo` directly instead of routing character operations through `storage`.
- Dependencies: `lib/storage/characterRepo.ts` (unchanged), `lib/middleware.ts` (`withAuth`/`withAuthAndParams`, unchanged), `lib/storage/runOp.ts` (unchanged).
- Interfaces/contracts touched: Import statements and call-site expressions only. Function signatures of `characterRepo`'s exports are identical to their `storage.*` equivalents, so no call-site argument changes are needed beyond the receiver (`storage.loadCharacters(x)` → `loadCharacters(x)`).

## Goals / Non-Goals

### Goals

- Replace character-domain `storage.*` calls in the six identified files with direct `characterRepo` imports.
- Preserve all existing auth, ownership, and validation behavior exactly as-is.
- Keep mixed files' non-character `storage` calls working unchanged (both imports coexist there).
- Add regression tests proving 401/404 behavior is unchanged at every touched call site.

### Non-Goals

- Modifying `characterRepo.ts`, including its internal `storage.saveCharacter` self-reference inside `saveCharacters` (tracked as a separate follow-up).
- Migrating any non-character `storage` method or any other #499 domain.
- Removing character methods from `lib/storage.ts`'s facade surface.
- Any change to route response shapes, status codes (other than confirming existing ones are preserved), or error messages.

## Decisions

### Decision 1: Per-file import strategy — full replacement vs. partial replacement

- Chosen: Two patterns based on file content. "Pure" files (`app/api/characters/route.ts`, `app/api/characters/[id]/route.ts`, `app/api/characters/import/route.ts`) drop the `storage` import entirely and import only the needed `characterRepo` named exports. "Mixed" files (`app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`) keep the `storage` import for their non-character calls and add a second import line for the one `characterRepo` function they need (`loadCharacterById` or `loadCharacters`).
- Alternatives considered: (a) Migrate every `storage` call in the mixed files regardless of domain, which would pull in membership/share/party narrow-repo work — rejected as out of scope for a Character-domain issue and would require repos that either don't exist yet or belong to other #499 sub-issues. (b) Leave mixed files entirely on `storage` to avoid dual imports — rejected because it fails the issue's acceptance criteria (callers for Character must import the narrow repo).
- Rationale: Matches #682's explicit scope (Character domain only) while still making measurable progress on every file that touches character data.
- Trade-offs: Mixed files temporarily have two storage-related imports (`storage` and `characterRepo`) instead of one, which is slightly less clean than a fully migrated file — acceptable since it's transitional until sibling domains (membership/shares/parties) are migrated by their own issues.

### Decision 2: No wrapper/adapter layer

- Chosen: Call sites import and invoke `characterRepo`'s named exports directly (e.g., `import { loadCharacters } from "@/lib/storage/characterRepo"`), with no intermediate re-export or facade shim.
- Alternatives considered: Adding a barrel re-export or compatibility shim to ease the transition — rejected as unnecessary indirection; `characterRepo.ts` already exports exactly what's needed, and the issue calls this "purely mechanical."
- Rationale: Simplicity and directness; avoids adding a layer that would itself need later removal.
- Trade-offs: None significant — this is the more direct approach with no downside identified.

### Decision 3: Regression tests target auth/ownership behavior, not internal repo logic

- Chosen: New/updated tests assert HTTP-level outcomes (401 unauthenticated, 404 for characters not owned by the caller) at each touched route, using existing test infrastructure/mocks for `characterRepo`/`storage`. No new tests are added for `characterRepo.ts` itself since its implementation is unchanged.
- Alternatives considered: Unit-testing `characterRepo` functions in isolation — rejected as redundant; those functions and their tests (if any) are unchanged by this migration and out of scope.
- Rationale: The risk this change introduces is entirely at the call-site/wiring level (wrong import, dropped argument, mock mismatch), so tests should target exactly that seam.
- Trade-offs: Relies on existing mocking patterns for `characterRepo` in the test suite; if none exist yet for a given route, the task adds minimal mocks consistent with how `storage` is currently mocked in that file's test suite.

## Proposal to Design Mapping

- Proposal element: Fully-swappable pure-character files (Scope, In Scope, items 1–3)
  - Design decision: Decision 1 (full replacement pattern)
  - Validation approach: `tsc --noEmit`, existing route test suites pass unmodified plus new 401/404 assertions
- Proposal element: Mixed files keeping both imports (Scope, In Scope, items 4–6)
  - Design decision: Decision 1 (partial replacement pattern)
  - Validation approach: `tsc --noEmit`, existing route test suites for membership/share/party calls remain green (proves `storage` import wasn't dropped)
- Proposal element: No behavior change (Why, Problem Space)
  - Design decision: Decision 2 (no wrapper layer, 1:1 rename)
  - Validation approach: Diff review — call sites should show only import/receiver changes, no argument or logic changes
- Proposal element: Regression tests for auth/ownership (Scope, In Scope, last item)
  - Design decision: Decision 3
  - Validation approach: New/updated Jest tests asserting 401 and 404 status codes at each touched route

## Functional Requirements Mapping

- Requirement: Character-domain `storage.*` calls in the six identified files are replaced with `characterRepo` calls.
  - Design element: Decision 1
  - Acceptance criteria reference: proposal.md "In Scope" (per-file bullets)
  - Testability notes: Verified by code diff review plus passing existing functional tests for each route (no behavior change expected, so existing test assertions should hold unmodified).
- Requirement: Mixed files retain working non-character `storage` calls after the edit.
  - Design element: Decision 1
  - Acceptance criteria reference: proposal.md "In Scope" items 4–6
  - Testability notes: Existing tests covering `getMember`/`addShare`/`removeShare`/`setPartyMemberLeftAt`/`listSharesForCampaign`/`buildSharedCharacterEntries`/`loadPartiesByCampaign`/`saveParty` in those three files must continue passing unmodified.
- Requirement: Unauthenticated requests to touched routes still return 401.
  - Design element: Decision 3
  - Acceptance criteria reference: proposal.md "Scope" (regression tests bullet)
  - Testability notes: New/updated test per route asserting 401 with no auth token/session.
- Requirement: Requests for a character not owned by `auth.userId` still return 404 (not a data leak).
  - Design element: Decision 3
  - Acceptance criteria reference: proposal.md "Scope" (regression tests bullet)
  - Testability notes: New/updated test per route asserting 404 when `auth.userId` doesn't own the requested character/resource.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: Ownership scoping (`auth.userId` passed into `loadCharacters`/`deleteCharacter`, campaign membership checks via `storage.getMember`) must be byte-for-byte unchanged.
  - Design element: Decision 2 (no wrapper, 1:1 rename — no room for argument drift)
  - Acceptance criteria reference: proposal.md "Risks" (authorization bypass risk)
  - Testability notes: Diff review confirms no argument changes; regression tests (Decision 3) provide a runtime safety net.
- Requirement category: reliability
  - Requirement: No change to error handling/status codes returned by touched routes for existing failure modes (not-found, validation errors, DB errors).
  - Design element: Decision 2
  - Acceptance criteria reference: proposal.md "What Changes" (no changes to `characterRepo.ts`/`lib/storage.ts`)
  - Testability notes: Existing route test suites' non-auth assertions (400s for invalid input, 500s for DB failures, etc.) must continue passing unmodified.

## Risks / Trade-offs

- Risk/trade-off: Mixed files carrying two storage-related imports could look inconsistent to future readers.
  - Impact: Minor readability/discoverability cost until sibling domains are migrated.
  - Mitigation: Accepted as transitional; each mixed file's imports will naturally consolidate further as membership/share/party domains get their own caller-migration issues.
- Risk/trade-off: The `characterRepo.saveCharacters` self-reference to `storage.saveCharacter` remains in place, meaning the facade dependency isn't fully eliminated even after this change.
  - Impact: `lib/storage.ts` still can't be trivially shrunk of its character methods until that follow-up is fixed.
  - Mitigation: Tracked as an explicit Non-Goal/follow-up issue rather than silently left undocumented.

## Rollback / Mitigation

- Rollback trigger: `tsc --noEmit` failures, test suite regressions (especially 401/404 assertions), or a production auth/ownership incident traced to one of the six touched files after deploy.
- Rollback steps: Revert the single PR for this change (all six files are edited within one change/PR per tasks.md); no data migration is involved, so a plain `git revert` is sufficient.
- Data migration considerations: None — this change touches only import statements and function call receivers, no persisted data or schema.
- Verification after rollback: Re-run the full test suite and confirm the six routes behave as they did pre-change (calls routed through `storage`).

## Operational Blocking Policy

- If CI checks fail: Fix forward before merge; do not bypass with `--admin` or force-merge (per project convention — branch protection is not to be bypassed).
- If security checks fail: Treat any finding touching auth/ownership logic in the six files as blocking, since this change's core risk is exactly that surface; do not waive without an explicit human-approved reason per `CLAUDE.md`'s waive policy.
- If required reviews are blocked/stale: Address reviewer comments before merge (per project convention — resolve every PR comment before merging); do not merge with unresolved comments.
- Escalation path and timeout: If blocked more than one business day awaiting review/CI infra (not code issues), flag to the user directly rather than working around the gate.

## Open Questions

None blocking. All decisions above were resolvable from the existing `characterRepo.ts` implementation and the six touched files' current structure, both inspected during the preceding explore-mode session.
