# Storage error-handling inventory

## Purpose

`lib/storage.ts` exports a single `storage` object (~1294 lines, 68 methods:
64 flat methods plus 4 nested under `storage.savedContent`) used by 36
dependent files. Each method independently decides whether to catch a DB
error and rethrow it, catch and swallow it (returning a non-throwing
sentinel), do something in between, or not catch it at all. Nothing
currently pins which of these behaviors is intentional versus incidental.

This directory is the first milestone of the `#499` storage-decomposition
epic (see [`#499`](https://github.com) parent tracking issue and
[`#500`](https://github.com), the issue that scoped this specific change). It
produces two artifacts `#499`'s planned `runStorageOp` design will consume:

1. `inventory.json` — a point-in-time, machine-readable classification of
   every method's current error-handling shape.
2. Characterization tests (in `tests/unit/lib/storage.characterization.test.ts`)
   for the three methods `#500` names explicitly — `loadSpellById`,
   `getMember`, `loadCharacters` — pinning current behavior, including its
   inconsistencies, so a later refactor can be checked against it.

**No production code changes.** `lib/storage.ts` is unmodified by this
change; see the proposal's Non-Goals.

## The taxonomy

Every entry in `inventory.json` has a `behavior` field with exactly one of
four values:

- **`swallow`** — the method catches a DB error, logs it, and returns a
  non-throwing sentinel (`null`, `[]`, `false`, or similar). Callers cannot
  distinguish "real empty/not-found result" from "the DB call failed."
- **`rethrow`** — the method catches a DB error, logs it, and re-throws it
  (usually the original `error`, occasionally wrapped in a custom error
  type such as `DuplicateMemberError`). Callers see a rejected promise.
- **`mixed`** — nested or multi-path error handling where sub-paths
  diverge, most commonly a two-tier query with an inner fallback that has
  its own independent try/catch. `loadCharacters` and `loadCharacterById`
  are both `mixed`, but they resolve differently at the outer layer (one
  swallows to `[]`, the other rethrows) — read each entry's `notes`, don't
  assume `mixed` implies any particular outer behavior.
- **`no-try`** — no try/catch is present around the DB call at all. This is
  kept distinct from `rethrow`: a `no-try` method never *decided* to
  propagate errors, it simply has no handling. `#499` will likely want to
  wrap `no-try` methods in `runStorageOp` first, since they currently have
  zero defensive behavior.

## How to read `inventory.json`

Top-level fields: `schemaVersion`, `generatedFrom` (always `lib/storage.ts`),
`generatedAt` (ISO timestamp of generation), `sourceLineCount` (the line
count of `lib/storage.ts` at generation time — see Staleness below), and
`methods`, an array of per-method entries.

Each entry in `methods`:

| Field | Meaning |
|---|---|
| `method` | Fully qualified name, e.g. `storage.loadSpellById` or `storage.savedContent.list` |
| `parent` | `null` for the ~64 flat methods, `"savedContent"` for the 4 nested ones |
| `domain` | A grouping label (e.g. `spells`, `campaignMembers`, `characters`) previewing plausible per-domain module boundaries for `#499`. This is a grouping convenience only — it does not commit `#499` to these exact module names. |
| `behavior` | One of the four taxonomy values above |
| `errorReturn` | The sentinel value returned on swallow (e.g. `"null"`, `"[]"`, `"false"`); `null` when not applicable (`rethrow`/`no-try`, or `mixed` — see that entry's `notes`) |
| `line` | Source line in `lib/storage.ts` where the method is defined |
| `callers` | `{file, fn, line}` entries for every call site found in non-test source files. `fn` is a best-effort match of the nearest enclosing named function/handler above the call site; some entries fall back to `null` when no enclosing declaration pattern matched (e.g. call sites inside deeply nested closures) |
| `existingTests` | Test file paths that already exercise this method (happy-path or otherwise), independent of whether they cover the error path |
| `characterizationTest` | Path to a test file that specifically pins this method's error-handling behavior per this change's taxonomy, or `null` if none exists yet |
| `notes` | Free-text explanation, used heavily for `mixed` entries and any method whose behavior isn't a clean instance of its category (e.g. methods that delegate to other swallowing/rethrowing methods without their own try/catch) |

## Staleness warning

**This inventory is a snapshot, not a live view.** It was generated against
`lib/storage.ts` at `sourceLineCount: 1294` lines as of `generatedAt`. The
moment `lib/storage.ts` changes — including `#499`'s own later milestones
moving methods into per-domain files — every `line` and `callers` entry can
drift out of date, and new methods added after this snapshot will have no
entry at all.

**`#499` must re-verify this inventory against the current source before
designing `runStorageOp` against it — not blindly trust it.** At minimum,
re-run the method-count check in `tasks.md` §6.4 (compare `inventory.json`'s
entry count against the actual method count on `storage`) before relying on
any classification here.

## Coverage gap

Per `#500`'s explicit scope, only three methods (`loadSpellById`, `getMember`,
`loadCharacters`) have characterization tests. The remaining ~61 methods are
inventoried (classified by direct source inspection) but not test-pinned —
their `characterizationTest` field is `null`. This is a known, accepted gap,
not an oversight; a later change can extend characterization coverage using
this inventory as its worklist.

## References

- Parent tracking issue: `#499` (storage layer decomposition into per-domain
  repos with centralized error handling via a planned `runStorageOp` helper)
- This change's issue: `#500`
- Machine-readable data: [`inventory.json`](./inventory.json)
