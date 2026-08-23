## Context

- Relevant architecture: `lib/storage.ts` is a single 64-method object,
  imported by 36 non-test files (125 call sites) and mocked by 11 test files,
  each method independently wrapping `getDatabase()` (`lib/db.ts`) in its own
  `try/catch`. This change adds three new, currently-unreferenced files under
  `lib/storage/` and `lib/telemetry/`; `lib/storage.ts` itself is not
  imported by, nor does it import, any of them yet.
- Dependencies: none new. `lib/db.ts`'s `getDatabase()` is referenced only in
  documentation/examples here, not imported by the new files themselves —
  `runStorageOp` is generic over the operation it wraps and has no MongoDB
  dependency.
- Interfaces/contracts touched: none existing. Three new public interfaces
  are introduced: `runStorageOp<T>()`, `logStorageEvent()`, and the
  `StorageError` class. These become the contract #502, #503, #504, and #527
  build against — see Decision 1-3 below.

## Goals / Non-Goals

### Goals

- Define a `runStorageOp<T>()` wrapper that gives every future migrated
  storage method identical, centrally-controlled error handling: not-found
  never throws, real failure always throws `StorageError` and is always
  logged.
- Define a `logStorageEvent()` seam with a fixed structured shape, emitting a
  three-way `outcome` (`success` / `not_found` / `error`) so storage health
  can eventually be monitored independent of route-level 404 counts.
- Define a `StorageError` class carrying enough context (`cause`, op name,
  collection) to correlate a thrown error back to its originating log line.
- Ship all three files with unit tests proving the contract in isolation.

### Non-Goals

- Migrating any existing `lib/storage.ts` method onto this wrapper.
- Choosing or implementing an OpenTelemetry (or other) export backend for
  `logStorageEvent` — it stays `console`-backed.
- Solving `getNextSessionNumber()`'s specific correctness bug (#527) — this
  design only ensures the wrapper *can* express "throw, don't return a
  colliding sentinel" when #527 is implemented on top of it.

## Decisions

### Decision 1: `runStorageOp<T>()` shape and the not-found classifier

- Chosen:

  ```ts
  interface RunStorageOpMeta<T> {
    name: string;
    collection: string;
    isEmpty?: (result: T) => boolean;
  }

  async function runStorageOp<T>(
    meta: RunStorageOpMeta<T>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const outcome = meta.isEmpty?.(result) ? "not_found" : "success";
      logStorageEvent({
        name: meta.name,
        collection: meta.collection,
        outcome,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      logStorageEvent({
        name: meta.name,
        collection: meta.collection,
        outcome: "error",
        durationMs: Date.now() - start,
        error,
      });
      throw new StorageError(meta.name, meta.collection, { cause: error });
    }
  }
  ```

- Alternatives considered:
  1. No classifier — `outcome` is only ever `success`/`error`, inferred
     purely from try/catch. Rejected: this was the original sketch from
     `/opsx:explore #501`, but it can't answer "how often does `getMember`
     find nothing," which is the specific method-level monitoring signal the
     user asked for (storage-layer visibility independent of route-level
     404s).
  2. Each method calls `logStorageEvent` itself for the not-found case,
     bypassing `runStorageOp`'s own success logging. Rejected: this splits
     the "always logged" guarantee across two code paths per method (one
     inside `runStorageOp`, one hand-written per call site), reintroducing
     exactly the per-method inconsistency this issue exists to remove.
  3. `runStorageOp` inspects the result generically (e.g.
     `result === null || (Array.isArray(result) && result.length === 0)`).
     Rejected: this is actively wrong for list methods, where zero results is
     a normal, non-notable answer (a user with no encounters yet is not a
     monitoring event) — see Decision 2.
- Rationale: the classifier is opt-in and per-call, keeping `runStorageOp` as
  the single place the "always logged, always tagged" guarantee lives, while
  letting each call site declare its own definition of "empty" (or none, for
  methods where emptiness isn't meaningful).
- Trade-offs: call sites that do want `not_found` telemetry must remember to
  pass `isEmpty`; a method migrated without it will just log `success` for a
  legitimate not-found. Mitigated by Decision 2's explicit inventory of which
  methods need it, carried into #502/#503/#504's task lists.

### Decision 2: only single-record lookups get a not-found classifier

- Chosen: only the 10 methods in `lib/storage.ts` with a `Promise<T | null>`
  return signature pass `isEmpty: (r) => r === null` when migrated. List
  methods (`Promise<T[]>`) never pass a classifier. Boolean existence checks
  (`spellExistsByNameAndSource`, `monsterExistsByNameAndSource`,
  `canAddToCampaignParty`) never pass a classifier either.

  | Method | Cluster | Classifier |
  |---|---|---|
  | `loadCombatState` | #502 | `isEmpty: (r) => r === null` |
  | `loadCharacterById` | #502 | `isEmpty: (r) => r === null` |
  | `getUserById` | #503 | `isEmpty: (r) => r === null` |
  | `loadGlobalCampaignTemplateById` | #503 | `isEmpty: (r) => r === null` |
  | `loadCampaignById` | #503 | `isEmpty: (r) => r === null` |
  | `loadCampaignByIdAny` | #503 | `isEmpty: (r) => r === null` |
  | `getMember` | #503 | `isEmpty: (r) => r === null` |
  | `findMonsterByNameAndSource` | #503 | `isEmpty: (r) => r === null` |
  | `loadSpellById` | #504 | `isEmpty: (r) => r === null` |
  | `updateSessionLog` | #504 | `isEmpty: (r) => r === null` |
  | all `Promise<T[]>` list methods | #502-504 | none — 0 results is `success` |
  | `spellExistsByNameAndSource`, `monsterExistsByNameAndSource`, `canAddToCampaignParty` | #503/#504 | none — `false` is `success` |

- Alternatives considered: applying `isEmpty` uniformly to any method
  returning `[]`. Rejected — a user with zero characters, zero encounters,
  etc. is completely normal and would flood `not_found` telemetry with noise
  that has no operational meaning, drowning out the genuinely interesting
  signal (a specific ID that should exist but doesn't).
- Rationale: `not_found` telemetry is only useful where "empty" is
  unambiguous — a single-record lookup by ID either finds that record or it
  doesn't. This table is the concrete contract #502/#503/#504's tasks.md
  files should each carry (already posted to #501 as a design comment during
  exploration).
- Trade-offs: boolean existence-checks arguably also have a meaningful
  not-found case (`false`), but `outcome: "not_found"` there would just
  restate the return value already visible in the log; deferred unless a
  concrete monitoring need for those three methods shows up later.

### Decision 3: `StorageError` shape

- Chosen:

  ```ts
  class StorageError extends Error {
    readonly op: string;
    readonly collection: string;

    constructor(op: string, collection: string, options: { cause: unknown }) {
      super(`Storage operation "${op}" failed on collection "${collection}"`, {
        cause: options.cause,
      });
      this.name = "StorageError";
      this.op = op;
      this.collection = collection;
    }
  }
  ```

- Alternatives considered: a discriminated-union style error with a
  `notFound` flag/variant. Rejected for this issue — per Decision 1, a
  not-found result never reaches `catch` and therefore never becomes a
  `StorageError` at all; no current or planned method throws on not-found, so
  a not-found discriminator on the error type would be dead code. Revisit
  only if a future method needs throw-on-not-found semantics.
- Rationale: matches the issue's acceptance criteria directly — "carries the
  original error as `cause` and the op/collection name for later log
  correlation." Using the standard `Error` `cause` option (not a custom
  field) keeps it compatible with existing error-logging/reporting tooling
  that already understands `Error.cause`.
- Trade-offs: none significant; this is the minimal shape the issue asks for.

## Proposal to Design Mapping

- Proposal element: "a missing document is a normal return value... decided
  by the query result, not an error path"
  - Design decision: Decision 1 (not-found is inferred by `isEmpty`, never
    throws) + Decision 2 (which methods classify emptiness at all)
  - Validation approach: unit test asserting `runStorageOp` returns the
    `fn()` result unchanged and logs `outcome: "not_found"` without throwing,
    when `isEmpty` matches.
- Proposal element: "anything that reaches catch is a real failure: it is
  always logged... and always rethrown as a typed StorageError — never
  swallowed"
  - Design decision: Decision 1 (`catch` block always calls
    `logStorageEvent` with `outcome: "error"` then throws `StorageError`)
  - Validation approach: unit test asserting a thrown error from `fn()` is
    always logged and always re-emerges as a `StorageError` instance, for
    every call regardless of `isEmpty` presence.
- Proposal element: "`logStorageEvent` emits structured, consistent fields
  for every call"
  - Design decision: Decision 1's fixed `{name, collection, outcome,
    durationMs, error?}` shape, called from exactly one place inside
    `runStorageOp` (never duplicated per method)
  - Validation approach: unit test asserting the exact field set and types
    logged for each of the three outcomes.
- Proposal element: "`StorageError` carries the original error as `cause` and
  the op/collection name for later log correlation"
  - Design decision: Decision 3
  - Validation approach: unit test asserting `error.cause`, `error.op`, and
    `error.collection` are all set and readable after being thrown by
    `runStorageOp`.
- Proposal element: "not yet wired into any of the 64 existing storage.ts
  methods"
  - Design decision: N/A by construction — the three new files import
    nothing from `lib/storage.ts`, and `lib/storage.ts` imports nothing from
    them.
  - Validation approach: no test needed; verified by the file diff itself
    (PR touches only `lib/storage/runOp.ts`, `lib/storage/errors.ts`,
    `lib/telemetry/logger.ts`, and their test files).

## Functional Requirements Mapping

- Requirement: not-found is never an error.
  - Design element: `isEmpty` classifier (Decision 1), applied per Decision
    2's table.
  - Acceptance criteria reference: issue #501, "a missing document is a
    normal return value."
  - Testability notes: assert no throw and `outcome: "not_found"` when
    `isEmpty` matches a successful `fn()` result.
- Requirement: real failure is always logged and always rethrown.
  - Design element: `runStorageOp`'s `catch` block (Decision 1).
  - Acceptance criteria reference: issue #501, "anything that reaches catch
    ... always logged ... always rethrown ... never swallowed."
  - Testability notes: assert exactly one `logStorageEvent` call with
    `outcome: "error"` and a thrown `StorageError` for every `fn()` rejection.
- Requirement: `StorageError` carries `cause`/op/collection.
  - Design element: `StorageError` class (Decision 3).
  - Acceptance criteria reference: issue #501 acceptance criteria, third
    bullet.
  - Testability notes: assert all three fields present and correctly valued.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: every storage operation's outcome (`success`/`not_found`/
    `error`) and duration must be visible in structured logs without reading
    application code, so #505's OpenTelemetry swap has a stable seam to
    attach to.
  - Design element: `logStorageEvent`'s fixed field shape, called from
    exactly one place (`runStorageOp`).
  - Acceptance criteria reference: issue #501, "single seam that will later
    be swapped for OpenTelemetry emission (#505) without touching any of the
    64 storage methods again."
  - Testability notes: snapshot-style assertion on the logged object shape
    for all three outcomes; no reliance on `console` call ordering beyond
    "exactly one call per `runStorageOp` invocation."
- Requirement category: reliability
  - Requirement: this change must not alter any existing runtime behavior,
    since it introduces dead code (nothing imports it yet).
  - Design element: file placement under new paths (`lib/storage/runOp.ts`,
    `lib/storage/errors.ts`, `lib/telemetry/logger.ts`) with zero imports
    from `lib/storage.ts` or any of the 36 caller files.
  - Acceptance criteria reference: issue #501, "not yet wired into any of the
    64 existing storage.ts methods."
  - Testability notes: existing test suite (11 mock files, 36 caller files)
    passes unmodified — no new imports added to any existing file in this PR.

## Risks / Trade-offs

- Risk/trade-off: the `isEmpty` classifier could be forgotten on a
  single-record method during #502-504, silently losing `not_found`
  telemetry for that method (it would just log `success`).
  - Impact: incomplete monitoring coverage, discovered only by absence of
    data rather than a failing test.
  - Mitigation: Decision 2's table is the explicit checklist carried into
    each migration issue's tasks; #502/#503/#504 review should cross-check
    each single-record method's PR diff against this table.
- Risk/trade-off: `StorageError` has no `notFound` variant, so if a future
  requirement needs "throw specifically because not found" (not covered by
  any of the 68 current methods), the class needs extending later.
  - Impact: a follow-up type change if that need materializes.
  - Mitigation: deferred deliberately per Decision 3 — no current method
    needs it, and speculative typing was rejected per this repo's own
    no-hypothetical-abstractions convention.

## Rollback / Mitigation

- Rollback trigger: any regression in the existing test suite (11 mock
  files, 36 caller files) after this PR merges — since this change adds only
  new, unreferenced files, any such regression would indicate an unrelated
  or unexpected import got introduced.
- Rollback steps: revert the PR (three new files + their tests); no data
  migration or wired-in behavior exists to unwind, since nothing imports
  these files yet.
- Data migration considerations: none — no schema, storage, or data changes.
- Verification after rollback: full existing test suite green;
  `lib/storage.ts` and its 36 callers untouched, confirmed by `git diff`
  showing only file additions/deletions under `lib/storage/runOp.ts`,
  `lib/storage/errors.ts`, `lib/telemetry/logger.ts`, and their tests.

## Operational Blocking Policy

- If CI checks fail: fix and re-push; this change has no external
  dependencies or infra changes, so CI failures should trace directly to the
  new files' own tests.
- If security checks fail: address findings before merge; no new external
  dependencies are introduced, so findings would most likely relate to
  `StorageError`'s handling of the wrapped `cause` value (e.g. ensure it
  doesn't leak into a client-facing message anywhere it's later serialized —
  out of scope for this issue since nothing renders it yet, but worth a
  reviewer's second look).
- If required reviews are blocked/stale: since #502, #503, and #504 are all
  blocked on this merging, treat review of this PR as high priority; escalate
  to the requester (`dougis`) directly rather than waiting out a normal
  review SLA.
- Escalation path and timeout: if unresolved after 1 business day, ping the
  requester directly given the downstream blocking chain.

## Open Questions

None. All design-level ambiguity from `/opsx:explore #501` (not-found vs.
error semantics, per-method telemetry granularity, and which methods need the
not-found classifier) was resolved during that session and is captured in
Decisions 1-3 above.
