## GitHub Issues

- #682

## Why

- Problem statement: Callers throughout `app/api/**` still import the monolithic `storage` facade from `@/lib/storage` for character reads/writes, even though `lib/storage/characterRepo.ts` already exists as the narrow, domain-specific replacement (split out under epic #499). Keeping callers on the facade defeats the purpose of the split — it keeps the god-object's surface area load-bearing and makes the facade harder to eventually shrink or remove.
- Why now: `characterRepo.ts` has existed since the #499 domain-splitting work landed (see prior storage-refactor changes, e.g. #503/#504) but caller migration was deferred per-domain. #682 is the Character-domain slice of that deferred work; doing it now keeps the facade's blast radius shrinking incrementally rather than in one large, riskier sweep.
- Business/user impact: None visible to end users. This is internal tech debt reduction — purely mechanical import/call-site changes with no behavior change. The impact is to future maintainability: narrower imports make it easier to reason about and test character persistence in isolation, and make the eventual removal of `storage.ts`'s character methods safe.

## Problem Space

- Current behavior: Six route files call character-related methods (`loadCharacters`, `loadCharacterById`, `saveCharacter`, `deleteCharacter`) through `storage.<method>()`, having imported the whole `storage` facade object from `@/lib/storage`.
- Desired behavior: Those call sites import and call the corresponding named export directly from `@/lib/storage/characterRepo` instead of going through `storage.<method>()`. Non-character storage calls in the same files (membership, shares, parties) are untouched and keep using `storage`.
- Constraints:
  - Purely mechanical per the issue's acceptance criteria — no behavior change, no refactor of `characterRepo.ts` itself.
  - Three of the six files are "mixed": they call both character and non-character storage methods, so the `storage` import must be kept alongside the new `characterRepo` import rather than removed outright.
  - Auth/ownership checks (`withAuth`/`withAuthAndParams`, `auth.userId` scoping, `storage.getMember` ownership gates) are pre-existing route logic that must not change as a side effect of the import swap.
- Assumptions:
  - `lib/storage/characterRepo.ts`'s existing exports (`loadCharacters`, `loadCharacterById`, `saveCharacter`, `saveCharacters`, `deleteCharacter`) are considered stable and correct as-is; this change does not modify their implementations.
  - No other files beyond the six identified during exploration call character-related `storage` methods. This was verified by grepping `app/` and `lib/` for `storage\.(loadCharacter|saveCharacter|loadCharacters|saveCharacters|deleteCharacter)` outside `lib/storage/`.
- Edge cases considered:
  - Mixed files must not lose the `storage` import entirely — only the character-specific calls move.
  - `characterRepo.saveCharacters` internally calls `storage.saveCharacter(character)` (a self-referential facade call from inside the narrow repo itself). This is a pre-existing quirk in `characterRepo.ts`, not a caller-import problem, and is explicitly out of scope here (see Non-Goals).

## Scope

### In Scope

- `app/api/characters/route.ts` — swap `storage.loadCharacters`, `storage.saveCharacter` to `characterRepo` imports (fully swappable; `storage` import removed).
- `app/api/characters/[id]/route.ts` — swap `storage.loadCharacters`, `storage.saveCharacter`, `storage.deleteCharacter` (fully swappable; `storage` import removed).
- `app/api/characters/import/route.ts` — swap `storage.loadCharacters`, `storage.saveCharacter` (fully swappable; `storage` import removed).
- `app/api/campaigns/[id]/characters/[cid]/route.ts` — swap only `storage.loadCharacterById`; keep `storage` import for `getMember`, `removeShare`, `setPartyMemberLeftAt`.
- `app/api/campaigns/[id]/characters/route.ts` — swap only `storage.loadCharacterById`; keep `storage` import for `getMember`, `addShare`, `listSharesForCampaign`, `buildSharedCharacterEntries`.
- `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` — swap only `storage.loadCharacters`; keep `storage` import for `getMember`, `loadPartiesByCampaign`, `saveParty`.
- Regression tests confirming auth/ownership behavior is unchanged post-swap (401 for unauthenticated, 404 — not a leak — for characters not owned by `auth.userId`) across the three pure-character routes and the `loadCharacterById` call sites in the mixed campaign routes.

### Out of Scope

- Any change to `characterRepo.ts`'s implementation, including its internal `storage.saveCharacter` self-reference inside `saveCharacters`.
- Migrating non-character `storage` methods (membership, shares, parties, campaigns) — tracked by other #499 sub-issues.
- Any change to auth middleware, ownership-check logic, or validation logic in the touched routes.
- Removing `storage.loadCharacters`/`saveCharacter`/`loadCharacterById`/`saveCharacters`/`deleteCharacter` from the facade itself (`lib/storage.ts`) — that's a later cleanup once all domains are migrated, not part of this per-domain caller migration.

## What Changes

- Six route files under `app/api/` update their imports and call sites to use `lib/storage/characterRepo.ts`'s named exports for character-specific operations, per the file-by-file breakdown in Scope.
- New/updated regression tests assert unchanged 401/404 behavior at the affected call sites.
- No changes to `characterRepo.ts`, `lib/storage.ts`, or any other module.

## Risks

- Risk: A mixed file's import edit accidentally drops the `storage` import used by adjacent non-character calls in the same file, breaking those routes.
  - Impact: Runtime errors (`storage is not defined`) or type errors in `app/api/campaigns/[id]/characters/[cid]/route.ts`, `.../characters/route.ts`, or `.../parties/[partyId]/route.ts`.
  - Mitigation: TypeScript compilation (`tsc --noEmit`) and the full test suite catch this at build/test time before merge; tasks.md will call out that mixed files keep both imports explicitly.
- Risk: An import swap accidentally changes an argument (e.g. drops `auth.userId` from a call), silently weakening an ownership check.
  - Impact: Potential authorization bypass — a user could read/modify another user's character.
  - Mitigation: `characterRepo`'s exported function signatures are unchanged from `storage`'s equivalent methods (verified during exploration), so call sites are a 1:1 rename, not a re-shape. New regression tests explicitly assert 401/404 behavior at every touched call site to catch any regression.
- Risk: Low risk of scope creep — the tempting adjacent fix (characterRepo's internal `storage.saveCharacter` self-reference) gets pulled in "while we're here," turning a mechanical PR into a mixed mechanical+behavioral one.
  - Impact: Harder review, harder rollback, blurs the "purely mechanical" acceptance criterion from #682.
  - Mitigation: Explicitly called out as a Non-Goal below; will be filed as a separate follow-up issue instead.

## Open Questions

None blocking. This proposal was preceded by an explore-mode session (see conversation) that identified the file list, mixed-file boundaries, and the `saveCharacters` self-reference question, and the user explicitly instructed proceeding to proposal mode afterward — treated as approval per the schema's explore-session exception.

## Non-Goals

- Fixing `characterRepo.saveCharacters`'s internal call to `storage.saveCharacter` (to be filed as a separate follow-up issue against `lib/storage/characterRepo.ts`).
- Migrating any other #499 domain (content, reference, session-log, share, spell, roll, membership, party, campaign) — each is its own issue/change.
- Removing character methods from `lib/storage.ts` itself.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
