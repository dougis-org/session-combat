## GitHub Issues

- #689
- #499 (parent epic)

## Why

- Problem statement: `lib/storage.ts` is a god-object facade. Implementations for campaign templates, character shares and user preferences already live in `lib/storage/campaignTemplateRepo.ts`, `lib/storage/shareRepo.ts` and `lib/storage/userPreferencesRepo.ts`, but 7 route handlers still import `{ storage }` just to reach them.
- Why now: Epic #499 dismantles the facade domain-by-domain. #687 (PR #810) did sessions and rolls; this is the "minor domains" batch.
- Business/user impact: None user-visible. Pure tech-debt paydown that narrows module dependencies and test mocks.

## Problem Space

- Current behavior: Route handlers call `storage.addShare`, `storage.removeShare`, `storage.listSharesForCampaign`, `storage.listAllSharesForCampaign`, `storage.loadGlobalCampaignTemplates`, `storage.loadGlobalCampaignTemplateById`, `storage.saveCampaignTemplate`, `storage.deleteCampaignTemplate`, `storage.getUserPreferences`, `storage.updateUserPreferences`. Their unit tests mock the whole `storage` facade.
- Desired behavior: Handlers import the narrow repo (`import * as shareRepo`, `campaignTemplateRepo`, `userPreferencesRepo`) and call it directly. Unit tests mock those repo modules instead of the facade.
- Constraints: Zero behavior change. The `storage` facade and its public shape stay intact (`tests/unit/lib/storage/facadeShape.test.ts` pins the key count).
- Assumptions: Repo functions are byte-for-byte equivalent to the facade delegations (`lib/storage.ts` forwards 1:1; preferences are re-exported directly).
- Edge cases considered:
  - All three share routes and `global/[id]/copy` already import other narrow repos, so removing `import { storage }` drops the facade dependency entirely from each file.
  - `tests/integration/api/mePreferences.test.ts` is HTTP-level (no module mocks) and needs no change.
  - Facade-level tests (`storage-shares.test.ts`, `storage/campaigns.test.ts` template block, `campaigns.character-sharing.integration.test.ts`) intentionally keep exercising `storage.*`.

## Scope

### In Scope

- 7 route handlers: `app/api/campaigns/[id]/characters/[cid]/route.ts`, `app/api/campaigns/[id]/characters/route.ts`, `app/api/campaigns/[id]/members/[userId]/route.ts`, `app/api/campaigns/global/route.ts`, `app/api/campaigns/global/[id]/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`, `app/api/me/preferences/route.ts`.
- 6 unit test files that mock the facade for those routes (listed in `design.md`).

### Out of Scope

- Changes to repo internals or to `lib/storage.ts`.
- Removing facade methods (other tests and callers still use them).
- Other domains (characters, parties, encounters, monsters, spells, etc.).
- Facade-level tests listed above.

## What Changes

- Replace `import { storage } from '@/lib/storage'` with namespace imports of the narrow repos in the 7 handlers; update call sites from `storage.<fn>` to `<repo>.<fn>`.
- Update the 6 unit tests to `jest.mock('@/lib/storage/<repo>')` instead of mocking the facade, replacing the `jest.mocked(storage).x` aliasing.

## Risks

- Risk: Test mock path mismatch lets a route fall through to the real DB or breaks mocked-return wiring.
  - Impact: Failing or flaky unit tests.
  - Mitigation: Run each updated test after its route change; follow the #687 pattern; the 3 repo modules are mocked with explicit factories like the existing `membershipRepo` mocks.
- Risk: A caller outside `app/` is missed.
  - Impact: Facade still has a live caller for that domain (harmless, but the issue's acceptance criterion would be unmet).
  - Mitigation: Re-grep `app lib` for the 10 facade method names after the change; expect zero hits outside `lib/storage.ts`.

## Open Questions

- No unresolved ambiguity. Exploration settled the two prior questions: (1) namespace imports (`import * as repo`) match #687 and keep call sites and mocks nearly unchanged; (2) `mePreferences.test.ts` is HTTP-level and unaffected.

## Non-Goals

- Eliminating `lib/storage.ts` or shrinking its public API.
- Any behavior, response, or schema change.
- Touching other domains in Epic #499.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
