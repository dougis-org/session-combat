## GitHub Issues

- #504
- Parent epic: #499

## Why

- Problem statement: `lib/storage.ts` still holds 18 inline method bodies for
  the content/reference domains — session logs, campaign-character shares,
  spell templates, campaign rolls, and two cross-cutting helpers (`load`,
  `clear`). Each decides independently whether to swallow a DB error and
  return a sentinel (`[]`, `null`, `false`, `1`), rethrow it, or not catch it
  at all. Seven of them swallow, making a real database outage
  indistinguishable from a legitimately empty or missing result. The most
  visible case, `storage.loadSpellById()`, causes `app/api/spells/[id]/route.ts`
  to report an outage as a routine `404`.
- Why now: #501 landed `runStorageOp`, `StorageError`, and `logStorageEvent`
  (merged via #531); #502/#503 migrated the first domain clusters. This is one
  of the last clusters keeping `lib/storage.ts` a partial god-object and the
  only remaining place where content/reference reads silently swallow outages.
- Business/user impact: operators currently cannot tell a database incident
  from normal traffic on spell, session-log, and share reads. After this
  change every failure emits a typed `StorageError` plus an OpenTelemetry
  error span/counter, and callers can surface a real `500`/`503` instead of a
  misleading empty page.

## Problem Space

- Current behavior (per `docs/storage-refactor/inventory.json`, re-verified
  against current `lib/storage.ts`):
  - Swallow → sentinel: `loadSessionLogs` (`[]`), `listSharesForCampaign`
    (`[]`), `listAllSharesForCampaign` (`[]`), `loadSpells` (`[]`),
    `loadSpellById` (`null`), `spellExistsByNameAndSource` (`false`), `load`
    (partial-empty object).
  - Rethrow (already correct, just needs relocating + telemetry):
    `saveSessionLog`, `updateSessionLog`, `deleteSessionLog`, `addShare`
    (special-cases Mongo `11000` → `DuplicateShareError`), `removeShare`,
    `saveSpellTemplate`, `deleteSpellTemplate`, `clear`.
  - No try/catch at all: `saveCampaignRoll`, `listCampaignRolls`.
  - Already migrated onto `runStorageOp` ahead of this issue:
    `getNextSessionNumber` — the "silent fallback to session 1" correctness
    risk flagged in the issue comments is **already closed**; both callers
    already return `503 SESSION_NUMBER_UNAVAILABLE`, with tests pinning it.
- Desired behavior: all 18 methods live in per-domain repo modules under
  `lib/storage/`, each built on `runStorageOp`. Real DB failures always throw
  `StorageError` (or a domain error via `rethrowAsIs`). "Genuine not-found"
  paths — no matching document, `findOneAndUpdate` returning nothing,
  `deletedCount === 0`, an empty collection query, and the pre-DB id-shape
  guard in `loadSpellById`/`deleteSpellTemplate` — stay non-throwing.
  `lib/storage.ts` re-exports every method under `storage` with identical
  names and signatures.
- Constraints:
  - `lib/storage.ts` public shape is unchanged; every existing test mock of
    `storage` must pass unmodified (`tests/unit/lib/storage/facadeShape.test.ts`).
  - No caller import statements change.
  - Follow the established pattern from `lib/storage/partyRepo.ts` and
    `lib/storage/membershipRepo.ts` (including `rethrowAsIs` for domain errors).
  - `#500` characterization tests covering this cluster must still pass;
    `tests/unit/lib/storage.characterization.test.ts` currently pins
    `loadSpellById` as `behavior: swallow` and **must be rewritten** to assert
    the new throw — an intentional behavior change to be called out in the PR.
- Assumptions:
  - `origin/main` contains the merged #501–#503 work (`lib/storage/runOp.ts`,
    `lib/storage/errors.ts` with `StorageError`, `lib/telemetry/logger.ts`,
    and the already-migrated repos).
  - `DuplicateShareError` lives in `lib/errors.ts` alongside
    `DuplicateMemberError`.
  - The `app/api/spells/[id]/route.ts` handlers already wrap `loadSpellById`
    in `try/catch` returning `500`, so no route logic change is required —
    only a test proving outage → `500`, distinct from not-found → `404`.
- Edge cases considered:
  - `loadSpellById` / `deleteSpellTemplate` pre-DB id-shape guard
    (`!id || typeof id !== "string" || id.length > 64`) returns the sentinel
    *before* any DB call — this is input validation, not a swallow, and must
    stay.
  - `addShare` Mongo duplicate-key (`code === 11000`) must still surface as
    `DuplicateShareError`, routed through `rethrowAsIs`.
  - `updateSessionLog` returns `SessionLog | null`; `null` means "no matching
    row", not a swallowed error.
  - `removeShare` / `deleteSessionLog` return `boolean` from `deletedCount`.
  - `load` aggregates five sub-loads via `Promise.all`; those sub-loads now
    throw (post #502/#503), so `load`'s old partial-empty catch is already
    dead code — its behavior has effectively already changed.
  - `spellExistsByNameAndSource` is called from `lib/import/dedupeEngine.ts`
    (not an HTTP route) — a throw there changes import-pipeline error flow.
  - `listCampaignRolls` carries ~40 lines of pagination/visibility logic that
    must move wholesale inside the `runStorageOp` callback unchanged.

## Scope

### In Scope

- Create `lib/storage/sessionLogRepo.ts`, `lib/storage/shareRepo.ts`,
  `lib/storage/spellRepo.ts`, `lib/storage/rollRepo.ts`.
- Move the 18 methods into those modules (plus `load`/`clear`), each built on
  `runStorageOp` with appropriate `name`, `collection`, `isEmpty`, and
  `rethrowAsIs`.
- Replace the inline bodies in `lib/storage.ts` with one-line delegations,
  preserving names/signatures.
- Rewrite `tests/unit/lib/storage.characterization.test.ts` `loadSpellById`
  section to assert throw-on-DB-error; keep the genuine-not-found assertion.
- Add throw-path unit coverage for the six newly-throwing swallow methods and
  the two newly-wrapped no-try roll methods.
- Add a route-level test for `app/api/spells/[id]/route.ts`: DB outage → `500`
  with a logged `StorageError`, distinct from not-found → `404`.
- Decide and document the fate of `load` (see Open Questions).
- Re-verify every `inventory.json` entry for this cluster against current
  source before coding (`docs/storage-refactor/plan.md` §Staleness;
  `tasks.md §6.4` method-count check).

### Out of Scope

- Any change to `runStorageOp`, `StorageError`, `logStorageEvent`, or the
  telemetry exporters (owned by #501).
- Migrating methods outside this cluster or re-touching #502/#503 domains.
- Changing `app/api/spells/[id]/route.ts` handler logic beyond what a
  behavior-preserving test requires (expected: no change).
- Broad refactors of `dedupeEngine.ts` beyond making it tolerate a thrown
  `spellExistsByNameAndSource`.
- Extending characterization-test coverage to the ~61 methods `#500` left
  un-pinned.

## What Changes

- New files: `lib/storage/sessionLogRepo.ts`, `lib/storage/shareRepo.ts`,
  `lib/storage/spellRepo.ts`, `lib/storage/rollRepo.ts`.
- `lib/storage.ts`: 18 inline bodies → delegations; `load`/`clear` resolved.
- Behavior change (intentional): `loadSessionLogs`, `listSharesForCampaign`,
  `listAllSharesForCampaign`, `loadSpells`, `loadSpellById`,
  `spellExistsByNameAndSource` now throw `StorageError` on DB failure instead
  of returning a sentinel.
- Behavior change (intentional): `saveCampaignRoll`, `listCampaignRolls` now
  emit telemetry and wrap failures in `StorageError`.
- `lib/import/dedupeEngine.ts`: handle a thrown `spellExistsByNameAndSource`
  (fail the import cleanly rather than proceeding as "not a duplicate").
- Tests: `storage.characterization.test.ts` rewrite; new repo + route tests.

## Risks

- Risk: A swallow→throw method has a caller that relied on the sentinel and
  now 500s (or crashes with an unhandled rejection) on a previously-tolerated
  empty result.
  - Impact: A working page becomes a 500 during a DB blip; worst case an
    unhandled rejection.
  - Mitigation: Enumerate every caller of the six swallow methods in `tasks.md`
    and confirm each already sits inside a `try/catch` or Next.js error
    boundary; add coverage where it does not. Caller list: `sessions/route.ts`,
    `campaigns/[id]/characters/route.ts`,
    `campaigns/[id]/members/[userId]/route.ts`, `spells/route.ts`,
    `spells/[id]/route.ts`, `lib/import/dedupeEngine.ts`.
- Risk: `dedupeEngine.ts` behavior regression — a DB blip during dedupe
  previously meant "import it"; now it throws mid-import.
  - Impact: Import aborts instead of silently creating a possible duplicate.
  - Mitigation: This is the safer behavior; make it explicit and covered by a
    test, and note it in the PR description.
- Risk: `lib/storage.ts` public shape drift breaks existing `storage` mocks.
  - Impact: Wide unit-test breakage.
  - Mitigation: Keep names/signatures identical; run
    `facadeShape.test.ts` and the full unit suite before opening the PR.
- Risk: `inventory.json` staleness leads to migrating a method whose current
  behavior differs from the snapshot (as already happened with
  `getNextSessionNumber`).
  - Impact: Wrong `isEmpty`/`rethrowAsIs`/sentinel decisions.
  - Mitigation: Mandatory re-verification pass against current source as the
    first task.
- Risk: `load`'s already-dead partial-empty catch masks an intent decision.
  - Impact: Ambiguity about whether `load` should throw or degrade.
  - Mitigation: Resolve via Open Questions before specs are finalized.

## Open Questions

- Question: What should happen to `storage.load()`? It has zero non-test
  callers and its error-degradation path is already dead post-#502/#503.
  Options: (a) wrap in `runStorageOp`, let it throw; (b) delete it entirely;
  (c) keep it as a plain facade orchestration method with no `runStorageOp`.
  - Needed from: @dougis
  - Blocker for apply: yes
- Question: Same question for `storage.clear()` — zero non-test callers, used
  only as a test utility. Wrap in `runStorageOp` (default), or leave as-is?
  - Needed from: @dougis
  - Blocker for apply: no (default: wrap)
- Question: For the list-returning reads (`loadSessionLogs`, `loadSpells`,
  `listSharesForCampaign`, `listAllSharesForCampaign`), set
  `isEmpty: (r) => r.length === 0` to mirror `partyRepo` convention (emits a
  `not_found` telemetry outcome for an empty result), or omit it since an
  empty collection query is a legitimate `success`?
  - Needed from: @dougis
  - Blocker for apply: no (default: follow `partyRepo` convention — set it)

## Non-Goals

- Not introducing new domain error types beyond the existing
  `DuplicateShareError`.
- Not changing HTTP status codes returned by any route (other than making the
  spells route's existing 500 path actually reachable on outage).
- Not adding retry, circuit-breaker, or fallback logic to any storage method.
- Not migrating `storage.savedContent.*` or any other remaining cluster.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
