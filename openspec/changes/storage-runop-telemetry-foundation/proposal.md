## GitHub Issues

- #501
- Related: #499 (parent epic), #500 (blast-radius inventory, closed), #502, #503, #504 (migrations blocked by this change), #527 (getNextSessionNumber correctness bug, blocked by this change)

## Why

- Problem statement: `lib/storage.ts`'s 64 methods each wrap their own ad hoc
  `try/catch` around `getDatabase()`, and the catch behavior is inconsistent —
  34 methods rethrow the caught DB error, 23 swallow it (log + return a
  sentinel `null`/`[]`/`undefined`/`false`), 3 are mixed (a nested try/catch
  swallows on one path but rethrows on another), and 8 have no try/catch at
  all. The same failure class produces different externally-visible outcomes
  depending only on which method happened to catch it — `loadSpellById()`
  swallows a DB outage into the same `null` it returns for a legitimate
  "spell not found," so `app/api/spells/[id]/route.ts` reports a real outage
  as a routine 404; `getMember()` rethrows the same failure class, so
  `lib/utils/campaign.ts`'s `assertCampaignAccess()` lets it propagate as an
  unhandled 500. Neither path produces a structured log line, so none of this
  is currently dashboardable or alertable — there is no logging/telemetry
  abstraction anywhere in this repo today.
- Why now: #500 (closed, merged via PR #507) produced the blast-radius
  inventory and characterization tests that pin this behavior; #501 is the
  first unblocked milestone of the `lib/storage.ts` god-object refactor epic
  (#499) and is the shared foundation every subsequent migration (#502, #503,
  #504) and the correctness fix in #527 depend on. Nothing downstream can
  start until this exists.
- Business/user impact: today, a transient MongoDB outage produces silently
  wrong behavior for end users (a spell that "doesn't exist" when it actually
  does; an unhandled crash instead of a clean error page) with zero telemetry
  to detect or diagnose it. This change does not fix those specific call
  sites (that's #502-504), but it builds the seam that makes fixing them, and
  monitoring storage health going forward, possible.

## Problem Space

- Current behavior: every `storage.*` method independently decides, ad hoc,
  whether a caught DB error is logged-and-swallowed or logged-and-rethrown;
  "not found" (a successful query that found nothing) and "real failure" (the
  query itself failing) are conflated in the 23 swallowing methods, because
  both currently produce the same sentinel return value.
- Desired behavior: a shared wrapper (`runStorageOp`) that draws one
  consistent line — a missing document is always a **normal return value**
  (decided by the query result, never an exception), while anything that
  reaches `catch` (the DB call itself failing) is always logged via a shared
  seam (`logStorageEvent`) and always rethrown as a typed `StorageError`,
  never swallowed. A separate seam (`logStorageEvent`) gives every storage
  operation structured, consistent telemetry fields regardless of outcome.
- Constraints:
  - This issue introduces three new files only — `lib/storage/runOp.ts`,
    `lib/telemetry/logger.ts`, `lib/storage/errors.ts`. No existing
    `lib/storage.ts` method is touched or migrated here (that's #502-504).
  - The 36 existing caller files and 11 test-mock files of `storage` must be
    completely unaffected by this change, since nothing wires into them yet.
  - `logStorageEvent` is console-backed for now; it is the seam #505 will
    later swap to OpenTelemetry without touching any of the 64 storage
    methods a second time.
- Assumptions:
  - The eventual per-method migrations (#502-504) will convert all 23
    currently-swallowing methods (plus the 3 mixed ones) to rethrow via
    `StorageError` on real failure — this is a deliberate, acknowledged
    behavior change for those methods' callers, tracked and flagged
    individually in #502/#503/#504, not something this issue needs to
    reconcile.
  - Not-found is only meaningful as "the query found nothing where a single
    record was expected." List-returning queries (`Promise<T[]>`) returning
    zero results is a normal, non-notable outcome, not a `not_found` event —
    only the 10 single-record lookup methods (`Promise<T | null>` signatures:
    `loadCombatState`, `loadCharacterById`, `getUserById`,
    `loadGlobalCampaignTemplateById`, `loadCampaignById`,
    `loadCampaignByIdAny`, `getMember`, `findMonsterByNameAndSource`,
    `loadSpellById`, `updateSessionLog`) will opt into `not_found` telemetry
    when migrated.
- Edge cases considered:
  - A method that needs to distinguish "not found" from "success with a
    value" for telemetry purposes (the 10 single-record lookups above) needs
    a way to tell `runStorageOp` that a `null` result means `not_found`
    rather than `success`, since `runStorageOp` is generic over `T` and
    cannot infer emptiness from the result alone.
  - Existence-check methods (`spellExistsByNameAndSource`,
    `monsterExistsByNameAndSource`, `canAddToCampaignParty`) return a
    boolean where `false` is a legitimate non-error answer; these are
    deliberately excluded from `not_found` classification (see design.md)
    since `outcome: "not_found"` would just restate the return value with no
    added telemetry signal.
  - `StorageError` must carry both the original error (as `cause`) and the op
    name / collection for later log correlation, per the issue's acceptance
    criteria.

## Scope

### In Scope

- `lib/storage/runOp.ts` — `runStorageOp()`: generic wrapper that runs an
  async operation, logs success/error (and optionally not-found) via
  `logStorageEvent`, and rethrows any caught error as `StorageError`.
- `lib/telemetry/logger.ts` — `logStorageEvent({name, collection, outcome,
  durationMs, error?})`: console-backed structured logging seam.
- `lib/storage/errors.ts` — `StorageError` class: carries `cause` (original
  error), op name, and collection name.
- Unit tests for all three files in isolation (no `lib/storage.ts` methods
  migrated onto them yet).

### Out of Scope

- Migrating any of the 64 existing `lib/storage.ts` methods onto
  `runStorageOp` (#502, #503, #504).
- Fixing `getNextSessionNumber()`'s swallow-to-`1` correctness bug (#527) —
  that fix depends on this foundation but is tracked separately.
- Swapping `logStorageEvent`'s console backend for OpenTelemetry (#505).
- Any change to caller import paths or the public `storage` object shape.

## What Changes

- Three new files added under `lib/storage/` and `lib/telemetry/`; nothing
  else in the repository is modified.
- Establishes the design contract (see design.md) that all four downstream
  issues (#502, #503, #504, #527) build against.

## Risks

- Risk: `runStorageOp`'s signature (particularly the not-found classifier
  mechanism) gets designed in a way that doesn't fit all 68 methods once
  #502-504 actually try to use it, forcing a breaking signature change
  mid-migration.
  - Impact: rework across up to three in-flight migration PRs.
  - Mitigation: design.md enumerates the concrete method shapes (list vs.
    single-record vs. boolean vs. void) this wrapper must support, verified
    against `docs/storage-refactor/inventory.json`, before locking the
    signature.
- Risk: because this issue touches no existing code, it's easy to under-scope
  the tests (e.g. only testing the happy path) and discover contract gaps
  only once #502-504 start integrating.
  - Impact: foundation churn discovered late, in the middle of a migration
    PR.
  - Mitigation: tests.md requires explicit coverage of the not-found vs.
    error distinction and the `StorageError` cause/name/collection contract,
    matching the acceptance criteria in issue #501.

## Open Questions

None — this proposal follows directly from `/opsx:explore #501`, and the
three open questions raised during that exploration (whether swallowing
methods should be flagged per-cluster, whether `logStorageEvent` needs
method-level not-found granularity, and whether not-found should ever throw)
were resolved by the user during that session and are reflected in the
Problem Space and Scope above.

## Non-Goals

- This change does not aim to achieve full behavior parity for the 23
  swallowing methods — deliberately changing their behavior (swallow →
  rethrow) is the explicit point of the broader epic (#499), executed
  cluster-by-cluster in #502-504.
- Not aiming to add OpenTelemetry, metrics export, or dashboards — the
  console-backed seam is intentionally the full scope here (#505 later).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
