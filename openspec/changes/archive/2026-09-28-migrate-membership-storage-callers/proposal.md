## GitHub Issues

- #685

## Why

- Problem statement: `membershipRepo.ts` was split out of the `lib/storage.ts` god object (epic #499, issue #503/#504) with all 7 membership methods, but callers still import the monolithic `storage` facade instead of the narrow repo. This keeps the facade alive as a load-bearing dependency for code that no longer needs it.
- Why now: #685 is a queued, purely mechanical follow-up to the completed repo split (PRs #672/#673 did this for the content/reference clusters). Doing it now keeps the migration moving domain-by-domain while the pattern is fresh and low-risk.
- Business/user impact: none directly — this is an internal dependency cleanup. It reduces the surface area of `storage.ts` so it can eventually be deleted, and narrows the blast radius of future membership-domain changes (callers only see the 7 membership methods, not the other ~20 methods still on the facade).

## Problem Space

- Current behavior: 15 non-test files call one or more of the 7 membership methods (`addMember`, `updateMemberStatus`, `listMembersForCampaign`, `getMember`, `listInvitationsForUser`, `getUserById`, `getUsersByIds`) through `import { storage } from '@/lib/storage'`, even though `lib/storage/membershipRepo.ts` already exports all 7 directly.
- Desired behavior: every one of those call sites imports the needed function(s) directly from `@/lib/storage/membershipRepo` instead of going through `storage.*`. Behavior, signatures, and error handling are unchanged — this is an import/call-site rewrite only.
- Constraints:
  - No behavior change permitted (per issue acceptance criteria) — this rules out touching `runStorageOp`, error types, or the internals of `membershipRepo.ts` itself.
  - 7 of the 15 files also call non-membership storage methods (`shareRepo`, `partyRepo`/`characterRepo`, `rollRepo`, `campaignTemplateRepo` domains) in the same file. Those other calls are out of scope for #685 and must keep using `storage.*` — the facade import in those files is not removed, only narrowed to the calls it's still needed for.
  - `lib/storage/membershipRepo.ts` is itself under `lib/storage/`, so importing it from other files under `lib/storage/` (e.g. `partyRepo.ts`) is an intra-package import, not a layering violation.
- Assumptions:
  - The `storage` facade re-exports `membershipRepo`'s functions unchanged (same name, same signature) — confirmed by comparing `lib/storage/membershipRepo.ts` against the #503 inventory doc (`docs/storage-refactor/issue-503-inventory-verification.md`), which shows all 7 signatures unchanged.
  - `.verity/.snapshot/` is a generated/mirrored directory (contains a copy of `app/api/campaigns/global/[id]/copy/route.ts`) and is not a real source location — it is excluded from scope.
- Edge cases considered:
  - Files where a membership call and a non-membership call are adjacent or interleaved (e.g. `app/api/campaigns/[id]/rolls/route.ts` calls `getMember`, `getUserById`, `listMembersForCampaign`, `listCampaignRolls`, `saveCampaignRoll`) — these need a partial rewrite, not a blanket find/replace of the import line.
  - `addMember`'s `DuplicateMemberError` handling: only `app/api/campaigns/[id]/members/route.ts:99` catches `instanceof DuplicateMemberError`; the other two `addMember` call sites (`app/api/campaigns/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`) create a brand-new campaign and can't hit the duplicate-key path, so they have no catch to preserve — confirmed in the #503 inventory doc.
  - `lib/storage/partyRepo.ts` calling `storage.getMember` is a repo-to-repo call through the facade rather than a top-level application caller. It is in-scope here (see Scope) because it's mechanically identical to the other call sites and removes one more internal dependency on the facade, but it's called out separately since it's architecturally different from a route handler import.

## Scope

### In Scope

- Rewrite all 15 non-test call sites (listed in Design) to import needed functions from `@/lib/storage/membershipRepo` instead of calling `storage.<method>`.
- For the 7 mixed-domain files, keep the existing `storage` facade import for the non-membership calls that remain in that file.
- Update/add unit test mocks so tests that currently mock `@/lib/storage`'s membership methods mock `@/lib/storage/membershipRepo` instead, for every touched file.
- `lib/storage/partyRepo.ts`'s internal `storage.getMember` call.

### Out of Scope

- Any change to `membershipRepo.ts` internals, `runStorageOp`, error types, or method signatures.
- Migrating any non-membership method (shareRepo, partyRepo/characterRepo, rollRepo, campaignTemplateRepo, campaignRepo, etc.) — those are separate epic #499 sub-issues.
- Removing membership methods from `storage.ts`/the facade itself (that's a later, separate cleanup once all consumers across the whole epic are migrated — deleting them now would break any caller not covered by this issue's inventory, including test files not enumerated here).
- Any change to `.verity/.snapshot/` (generated artifact, not source).

## What Changes

- 8 files get a full import swap (facade import removed, `membershipRepo` import added): `lib/utils/campaign.ts`, `lib/server/transport.ts`, `app/api/campaigns/[id]/parties/route.ts`, `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`, `app/api/campaigns/route.ts`, `app/api/me/invitations/route.ts`, `app/api/campaigns/[id]/members/route.ts`, `app/api/campaigns/[id]/members/me/route.ts`.
- 7 files get a partial import swap (facade import kept for other domains, `membershipRepo` import added for the membership calls): `lib/storage/partyRepo.ts`, `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`, `app/api/campaigns/[id]/rolls/route.ts`, `app/api/campaigns/[id]/messages/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`.
- Corresponding unit test files updated to mock `@/lib/storage/membershipRepo` instead of (or in addition to) `@/lib/storage`, wherever they mock the 7 membership methods.

## Risks

- Risk: Missing a call site not caught by the grep-based inventory (e.g. a dynamic/aliased import, or a method called via a re-export).
  - Impact: a stray file keeps using the facade for membership calls, silently under-delivering the issue's acceptance criteria.
  - Mitigation: after the rewrite, re-run the same grep pattern (`storage\.(addMember|updateMemberStatus|listMembersForCampaign|getMember|listInvitationsForUser|getUserById|getUsersByIds)\(`) across the repo and confirm zero non-test, non-archived matches remain.
- Risk: Partial-import files could accidentally leave an unused `storage` import (if a later edit removes the last non-membership call) or an unused `membershipRepo` import.
  - Impact: lint/build failure (unused import), not a runtime bug.
  - Mitigation: run typecheck/lint as part of tasks; this is caught immediately.
  - Impact: false-positive assertions if a test mocks `storage.getMember` but the code no longer calls it, the test would still pass (mock unused) while giving no real coverage.
  - Mitigation: tests.md includes an explicit check that each touched file's test mocks match what the file actually imports post-migration.
- Risk: Test files not enumerated in this proposal (only found via `grep -rn "storage\."`, not exhaustively via jest --listTests) might reference `storage.<membershipMethod>` mocks tied to the old import path.
  - Impact: tests silently stop verifying real behavior, or fail if they assert on a mock that's never called.
  - Mitigation: tasks.md includes a step to search test files for the same 7 method names and update any mock wiring found, not just the 15 production files identified here.

## Open Questions

- Question: Should `lib/storage/partyRepo.ts`'s `storage.getMember` call be migrated in this change, or deferred to whatever issue eventually migrates `partyRepo.ts` callers?
  - Needed from: repo owner (@dougis)
  - Blocker for apply: no — resolved for this proposal: **included in scope**, since it is mechanically identical to the other call sites (same method, same signature), already sits inside `lib/storage/`, and reduces one more facade dependency without touching `partyRepo`'s own public API or its callers.
- Question: The 10 files with a full or partial swap all currently exist with matching production/test pairs found by grep, but no exhaustive test-suite scan was run. Is a full test-file grep sweep (beyond the enumerated 15 production files) acceptable as part of tasks/apply, or should test discovery be a separate design step first?
  - Needed from: repo owner (@dougis)
  - Blocker for apply: no — resolved for this proposal: the tasks/tests artifacts will include an explicit repo-wide grep for the 7 method names across `tests/**` as a discovery step before editing, rather than deferring it further.

## Non-Goals

- Deleting `storage.ts` or the membership methods from the facade.
- Changing any membership business logic, validation, or error contracts.
- Migrating any other domain (shares, parties, characters, rolls, campaigns, campaign templates).
- Performance optimization of membership queries.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
