## Context

- Relevant architecture: `lib/storage.ts` exposes one `storage` object
  consumed by ~36 files. The #499 epic decomposes it into per-domain modules
  under `lib/storage/`, each method wrapped in `runStorageOp`
  (`lib/storage/runOp.ts`) which centralizes: try/catch, `StorageError`
  wrapping, optional `rethrowAsIs` domain-error passthrough, `isEmpty` →
  `not_found` telemetry classification, and `logStorageEvent`
  (`lib/telemetry/logger.ts`) emitting an OTel span + counter per op.
  `lib/storage.ts` becomes a thin facade of one-line delegations.
- Dependencies: `lib/storage/runOp.ts`, `lib/storage/errors.ts`
  (`StorageError`), `lib/telemetry/logger.ts`, `lib/errors.ts`
  (`DuplicateShareError`), `lib/storage/helpers.ts`
  (`normalizeStoredEntityId`, `buildEntityQuery`), `lib/db.ts`
  (`getDatabase`). Reference implementations: `lib/storage/partyRepo.ts`,
  `lib/storage/membershipRepo.ts`, `lib/storage/characterRepo.ts`.
- Interfaces/contracts touched: the `storage` object's method surface
  (names/signatures unchanged); the return contract of six reads changes from
  "sentinel on any failure" to "sentinel only on genuine not-found, throw
  otherwise". Collection names used for telemetry labels: `sessionLogs`,
  `campaignCharacterShares`, `spellTemplates`, `campaignRolls`.

## Goals / Non-Goals

### Goals

- Move all 18 cluster methods into `sessionLogRepo.ts`, `shareRepo.ts`,
  `spellRepo.ts`, `rollRepo.ts` (+ `load`/`clear`), each built on
  `runStorageOp`.
- Every real DB failure in the cluster produces a typed `StorageError` and one
  telemetry error event; genuine not-found stays non-throwing.
- `lib/storage.ts` public shape byte-compatible with existing mocks; zero
  caller import changes.
- `loadSpellById` outage path proven to yield `500` (not `404`) at the route.

### Non-Goals

- Modifying `runStorageOp` / telemetry internals.
- Touching other clusters or #502/#503 domains.
- Changing route status codes or adding resilience logic (retry/fallback).

## Decisions

### Decision 1: One repo module per domain, mirroring existing repos

- Chosen: `lib/storage/sessionLogRepo.ts`, `lib/storage/shareRepo.ts`,
  `lib/storage/spellRepo.ts`, `lib/storage/rollRepo.ts`. Each exports named
  `async` functions; `lib/storage.ts` imports the module namespace
  (`import * as spellRepo from "@/lib/storage/spellRepo"`) and delegates
  (`async loadSpellById(id) { return spellRepo.loadSpellById(id); }`).
- Alternatives considered: (a) a single `contentRepo.ts` for all four domains
  — rejected, breaks the established one-domain-per-file convention and the
  `domain` grouping in `inventory.json`; (b) class-based repos — rejected, the
  codebase uses free functions.
- Rationale: consistency with `partyRepo`/`membershipRepo` makes review
  mechanical and keeps the facade diff trivially verifiable.
- Trade-offs: four new small files; some cross-repo imports (e.g. `shareRepo`
  ↔ `partyRepo` already reference each other via the `storage` facade — keep
  using the facade for cross-domain calls to avoid new import cycles, as
  `partyRepo` does).

### Decision 2: Swallow → throw for the six sentinel-returning reads

- Chosen: `loadSessionLogs`, `listSharesForCampaign`,
  `listAllSharesForCampaign`, `loadSpells`, `loadSpellById`,
  `spellExistsByNameAndSource` drop their `try { … } catch { return sentinel }`
  and run the raw query inside `runStorageOp`. DB failure → `StorageError`.
- Alternatives considered: keep swallowing but add telemetry — rejected, the
  whole point of #499 is to make outages observable *and* actionable by
  callers; a swallowed error the caller can't see is still a masked outage.
- Rationale: matches #501 intent and the `characterRepo.loadCharacterById`
  precedent (mixed→throw at the outer layer).
- Trade-offs: callers that leaned on the sentinel now see a rejected promise;
  mitigated by the caller audit in `tasks.md` and new tests.

### Decision 3: Preserve genuine not-found and pre-DB guard paths

- Chosen: inside each `runStorageOp` callback, return `null` / `[]` / `false`
  for a real empty query result. Keep the pre-DB id-shape guard
  (`!id || typeof id !== "string" || id.length > 64`) in `loadSpellById` and
  `deleteSpellTemplate` *outside* `runStorageOp` (before the call), returning
  the sentinel directly — it is input validation, not error handling.
- Alternatives considered: move the guard inside `runStorageOp` — rejected, it
  would emit a misleading telemetry event for a client input error.
- Rationale: `runStorageOp`'s `isEmpty` already models "not_found" as a
  non-error outcome; the guard is a separate concern.
- Trade-offs: a small amount of logic stays in the facade-adjacent function
  body rather than the DB callback.

### Decision 4: `rethrowAsIs` for `addShare` duplicate-key

- Chosen: `runStorageOp({ name: "addShare", collection: "campaignCharacterShares",
  rethrowAsIs: (e) => e instanceof DuplicateShareError }, async () => { … })`.
  Inside the callback, keep the `error.code === 11000 → throw new
  DuplicateShareError(...)` translation.
- Alternatives considered: check `code === 11000` inside `rethrowAsIs` directly
  — rejected, loses the typed `DuplicateShareError` the caller matches on.
- Rationale: identical to `membershipRepo`'s `DuplicateMemberError` handling.
- Trade-offs: none; direct precedent.

### Decision 5: Wrap the two no-try roll methods

- Chosen: `saveCampaignRoll` and `listCampaignRolls` move into `rollRepo.ts`
  inside `runStorageOp` with `collection: "campaignRolls"`. All of
  `listCampaignRolls`'s pagination/visibility-filter/cursor logic moves
  verbatim into the callback; the `{ rolls, nextCursor? }` return shape is
  unchanged (`runStorageOp` is return-value transparent).
- Alternatives considered: leave them uncaught — rejected, they'd be the only
  cluster methods with no telemetry.
- Rationale: consistency; they already propagate errors, so wrapping only adds
  observability + `StorageError` typing.
- Trade-offs: `listCampaignRolls` never returns an empty-sentinel, so no
  `isEmpty` needed; an empty page is a legitimate `success`.

### Decision 6: `load` and `clear` — pending Open Question, default = wrap

- Chosen (default, pending @dougis): `clear` → `runStorageOp` wrap in a
  `miscRepo.ts` (or `sessionLogRepo`-adjacent `storageMisc.ts`). `load` →
  keep as a plain facade orchestration method calling the already-wrapped
  per-domain loaders via `this.*`, with **no** outer `try/catch` (its old
  partial-empty degradation path is already dead code post-#502/#503).
- Alternatives considered: delete `load` (zero non-test callers) — viable but
  widens scope and touches `facadeShape.test.ts` expectations; defer to the
  Open Question.
- Rationale: `load` has no DB call of its own, so wrapping it in
  `runStorageOp` would double-emit telemetry; orchestration-only is cleaner.
- Trade-offs: `load` diverges slightly from "everything on `runStorageOp`";
  documented and gated on the Open Question answer.

### Decision 7: Rewrite the `loadSpellById` characterization test

- Chosen: `tests/unit/lib/storage.characterization.test.ts` — replace the
  `behavior: swallow` / `resolves.toBeNull()` assertions for a simulated DB
  error with `rejects.toThrow(StorageError)`; keep the assertion that a
  genuine missing document and a bad-shape id still resolve to `null`. Header
  comment updated to `behavior: throw (changed by #504)`.
- Alternatives considered: leave the test and `@ts-expect-error`/skip it —
  rejected, it must actively pin the new contract.
- Rationale: the AC requires the intentional behavior change be explicit and
  covered.
- Trade-offs: one characterization test's git history shows an intentional
  contract flip — called out in the PR description per Change Control.

## Proposal to Design Mapping

- Proposal element: "Move 18 methods into per-domain repos on `runStorageOp`."
  - Design decision: Decisions 1, 5, 6.
  - Validation approach: new `*Repo.test.ts` files + `facadeShape.test.ts`
    green + full unit suite green.
- Proposal element: "Six swallow reads now throw `StorageError`."
  - Design decision: Decision 2, 3.
  - Validation approach: per-method unit test simulating a rejected
    `db.collection().find()/findOne()/countDocuments()` and asserting
    `rejects.toThrow(StorageError)`; separate test asserting genuine-empty
    still returns the sentinel.
- Proposal element: "`loadSpellById` outage → real 500, distinct from 404."
  - Design decision: Decision 2, 3, 7.
  - Validation approach: `tests/unit/api/spells/[id].route.test.ts` — mock
    `storage.loadSpellById` to reject with `StorageError` → assert `500` +
    `console.error`; mock to resolve `null` → assert `404`.
- Proposal element: "`addShare` duplicate-key still surfaces `DuplicateShareError`."
  - Design decision: Decision 4.
  - Validation approach: `shareRepo.test.ts` — inject `{ code: 11000 }` →
    `rejects.toThrow(DuplicateShareError)`; inject generic error →
    `rejects.toThrow(StorageError)`.
- Proposal element: "No-try roll methods gain telemetry + `StorageError`."
  - Design decision: Decision 5.
  - Validation approach: `rollRepo.test.ts` — reject the DB call → assert
    `StorageError` + one `logStorageEvent` error call; happy path → assert
    `{ rolls, nextCursor }` shape unchanged and one success event.
- Proposal element: "`dedupeEngine.ts` tolerates a thrown `spellExistsByNameAndSource`."
  - Design decision: Decision 2 + caller audit (tasks).
  - Validation approach: dedupe-engine unit test — `spellExistsByNameAndSource`
    rejects → import fails cleanly (no silent "not a duplicate" path).
- Proposal element: "Public shape unchanged; mocks pass unmodified."
  - Design decision: Decision 1.
  - Validation approach: `facadeShape.test.ts` + run existing route/unit tests
    that mock `storage` without editing them.
- Proposal element: "Re-verify `inventory.json` against current source."
  - Design decision: first task; `tasks.md §6.4` method-count check.
  - Validation approach: documented diff note in the PR if any entry drifted
    (as `getNextSessionNumber` already did).
- Proposal element: "Resolve `load`/`clear` fate."
  - Design decision: Decision 6 (default) + Open Questions.
  - Validation approach: whichever path is chosen, `facadeShape.test.ts` and
    any `load`/`clear` tests stay green.

## Functional Requirements Mapping

- Requirement: All 18 methods relocated and built on `runStorageOp` (except
  `load` per Decision 6).
  - Design element: Decisions 1, 5, 6.
  - Acceptance criteria reference: spec "Storage repo module boundaries",
    "Centralized error handling for content/reference domains".
  - Testability notes: grep `lib/storage.ts` shows no `getDatabase(` call in
    any cluster method body; new repo files each `import { runStorageOp }`.
- Requirement: DB failure → `StorageError`; genuine not-found → sentinel.
  - Design element: Decisions 2, 3, 4.
  - Acceptance criteria reference: spec "Failure surfaces as StorageError",
    "Not-found paths remain non-throwing".
  - Testability notes: paired tests per method (reject-path vs empty-path).
- Requirement: `loadSpellById` route contract — outage `500`, missing `404`.
  - Design element: Decision 7.
  - Acceptance criteria reference: spec "Spell-by-id route distinguishes
    outage from not-found".
  - Testability notes: route test with two mock behaviors.
- Requirement: `lib/storage.ts` public shape unchanged; no caller import
  changes.
  - Design element: Decision 1.
  - Acceptance criteria reference: spec "Facade shape preserved".
  - Testability notes: `facadeShape.test.ts`; `git grep` for changed import
    lines in caller files returns nothing.
- Requirement: `#500` characterization tests for this cluster still pass
  (with the one intentional `loadSpellById` flip).
  - Design element: Decision 7.
  - Acceptance criteria reference: spec "Characterization coverage preserved".
  - Testability notes: `tests/unit/lib/storage.characterization.test.ts` green.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: every cluster storage op emits exactly one telemetry event
    (success / not_found / error) with `name` + `collection`.
  - Design element: `runStorageOp` wrapping (Decisions 1–5).
  - Acceptance criteria reference: spec "One telemetry event per storage op".
  - Testability notes: assert `logStorageEvent` call count/args in repo tests
    (mock `@/lib/telemetry/logger`).
- Requirement category: reliability
  - Requirement: no silent degradation — a DB outage never masquerades as an
    empty/absent result to a caller.
  - Design element: Decision 2.
  - Acceptance criteria reference: spec "Failure surfaces as StorageError".
  - Testability notes: reject-path tests per method; `dedupeEngine` test.
- Requirement category: performance
  - Requirement: no added latency beyond `runStorageOp`'s existing
    `Date.now()` bookkeeping; queries unchanged.
  - Design element: Decisions 1, 5 (logic moved verbatim).
  - Acceptance criteria reference: spec "Query behavior unchanged".
  - Testability notes: diff review shows identical filters/sorts/projections;
    existing happy-path tests unchanged.
- Requirement category: security
  - Requirement: no change to auth scoping (`userId`, `GLOBAL_USER_ID`,
    campaign-role visibility filters in `listCampaignRolls`).
  - Design element: Decision 5 (logic verbatim).
  - Acceptance criteria reference: spec "Access scoping unchanged".
  - Testability notes: existing scoping tests pass unmodified; visibility
    filter test in `rollRepo.test.ts`.

## Risks / Trade-offs

- Risk/trade-off: a swallow→throw caller isn't inside an error boundary.
  - Impact: unhandled promise rejection / 500 on a DB blip.
  - Mitigation: caller-audit task enumerating all six methods' call sites;
    add `try/catch` or coverage where missing before merge.
- Risk/trade-off: `inventory.json` drift causes a wrong wrap decision.
  - Impact: incorrect `isEmpty`/sentinel/`rethrowAsIs`.
  - Mitigation: mandatory re-verification task as step 1.
- Risk/trade-off: `load` left off `runStorageOp` looks inconsistent.
  - Impact: reviewer confusion.
  - Mitigation: Decision 6 rationale documented; gated on Open Question.
- Risk/trade-off: moving `listCampaignRolls`'s cursor logic introduces a
  transcription bug.
  - Impact: broken pagination.
  - Mitigation: move verbatim; port existing `listCampaignRolls` tests into
    `rollRepo.test.ts` and add a cursor round-trip test.

## Rollback / Mitigation

- Rollback trigger: post-deploy spike in `storage.*` error spans for
  `sessionLogs` / `campaignCharacterShares` / `spellTemplates` /
  `campaignRolls`, or a user-facing 500 regression on spell/session/share
  routes traced to `StorageError`.
- Rollback steps: revert the squash-merge commit on `main`
  (`git revert <sha>`), open the revert PR, auto-merge with `--squash`. No
  schema or data changes to unwind.
- Data migration considerations: none — this change touches no collection
  structure, indexes, or documents; queries are byte-identical.
- Verification after rollback: `storage.*` error-span rate returns to
  baseline; spell/session/share route smoke tests pass; full unit suite green
  on the reverted `main`.

## Operational Blocking Policy

- If CI checks fail: fix the findings — that is the default. The `ci-gate` and
  Codacy checks are required on `main` (repo ruleset, squash-only, 0
  approvals). Do not use `--admin` or push directly to `main`.
- If security checks fail: treat as blocking; no waivers on agent judgment.
  Use `verity waive` only to relay a risk a named human review, ADR, or the
  user explicitly accepted, citing that source in `--reason`. For a
  pattern-level false positive use `verity feedback finding … false_positive`.
- If required reviews are blocked/stale: resolve every PR comment before
  merging (project rule). Re-request review after pushing fixes; do not merge
  around an unresolved thread.
- Escalation path and timeout: if CI is red for reasons unrelated to this
  change (flaky infra) for >24h, ping @dougis on the PR with the failing run
  link rather than retrying blindly or waiving.

## Open Questions

- `load`: wrap / delete / orchestration-only? (blocks apply — Decision 6
  default is orchestration-only.)
- `clear`: wrap in `runStorageOp` or leave as-is? (default: wrap.)
- `isEmpty` on the four list reads: set it (mirror `partyRepo`) or omit?
  (default: set it.)
- Where do `load`/`clear` physically live if not deleted — a new
  `lib/storage/storageMisc.ts`, or inline in the facade? (default: `clear` in
  `storageMisc.ts`, `load` inline in the facade.)
