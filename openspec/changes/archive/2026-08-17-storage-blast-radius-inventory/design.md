## Context

`lib/storage.ts` exports a single `storage` object (~1294 lines, ~64 methods)
used by 36 dependent files. Each method independently wraps its DB call in a
try/catch and either rethrows or swallows-and-logs on error; a few do neither
cleanly. No test currently exercises the DB-error branch of any of these
methods, so nothing pins which behavior is intentional versus incidental.

This change produces two things #499's `runStorageOp` design will consume:

1. `docs/storage-refactor/inventory.json` — a snapshot classification of
   every method's current error-handling shape.
2. Characterization tests for the three methods #500 names explicitly,
   proving current behavior (including its inconsistencies) so a later
   refactor can be checked against it.

No production code changes. This is a documentation + test-pinning step only.

## Goals / Non-Goals

**Goals:**
- Define a fixed, 4-value behavior taxonomy (`swallow`, `rethrow`, `mixed`,
  `no-try`) that #499 can design `runStorageOp` against without
  renegotiating vocabulary later.
- Produce a complete, per-method inventory (all flat methods + the nested
  `savedContent` sub-object) in a machine-readable format.
- Write characterization tests for `loadSpellById`, `getMember`, and
  `loadCharacters` that pin current behavior, including the specific
  ambiguity/inconsistency each demonstrates.

**Non-Goals:**
- Changing any behavior in `lib/storage.ts`.
- Achieving full 64-method characterization coverage (three methods are the
  required minimum; the inventory notes coverage gaps for the rest so a
  later change can pick them up).
- Designing `runStorageOp` itself, or deciding which behavior (swallow vs.
  rethrow) each method *should* have going forward.

## Decisions

### 1. Taxonomy: four categories, not a boolean

Considered a simple boolean (`swallows: true/false`), but `loadCharacters`
doesn't fit: its try/catch nests, with the outer catch's fallback path having
its own independent try/catch. Modeling that as a plain boolean would force
a false choice or require a separate ad-hoc flag. Decision: four values —
`swallow` (catch → log → return a non-throwing sentinel), `rethrow` (catch →
log → `throw error`), `mixed` (nested/multi-path handling where sub-paths
diverge, e.g. `loadCharacters`), `no-try` (no try/catch present; DB errors
propagate unhandled by construction, distinct from an intentional rethrow).
`no-try` is kept separate from `rethrow` because it represents an absence of
handling, not a decision to rethrow — that distinction matters for #499,
which will likely want to add `runStorageOp` wrapping specifically to
`no-try` methods first since they currently have zero defensive behavior.

Alternative considered: a free-text `notes`-only approach with no enum. Rejected because #499's `runStorageOp` needs to programmatically group methods by behavior class; free text can't be switched on.

### 2. Inventory format: JSON, not just a Markdown table

The requester specified JSON. Rationale beyond preference: a Markdown table
in `docs/storage-refactor-plan.md` (the issue's suggested location) is
readable but not consumable by tooling — and #499's `runStorageOp` milestone
will plausibly want to script against "all `no-try` methods" or "all
`swallow` methods returning `[]`" rather than hand-parse prose. `plan.md`
stays a short narrative pointer; `inventory.json` is the source of truth.

Schema (see `docs/storage-refactor/inventory.json` once written):

```json
{
  "schemaVersion": 1,
  "generatedFrom": "lib/storage.ts",
  "generatedAt": "<ISO date>",
  "sourceLineCount": 1294,
  "methods": [
    {
      "method": "string",
      "parent": "string | null",
      "domain": "string",
      "behavior": "swallow | rethrow | mixed | no-try",
      "errorReturn": "string | null",
      "line": "number",
      "callers": [{ "file": "string", "fn": "string", "line": "number" }],
      "existingTests": ["string"],
      "characterizationTest": "string | null",
      "notes": "string | null"
    }
  ]
}
```

`domain` values are chosen to preview plausible per-domain module boundaries
for #499 (e.g. `spells`, `campaignMembers`, `characters`, `savedContent`),
but this change does not commit #499 to those exact module names — it's a
grouping convenience, not an API contract.

### 3. Folder location: `docs/storage-refactor/`

The issue allows either `docs/storage-refactor-plan.md` directly or "a
linked doc." A dedicated folder is chosen over a single file because this
change produces two artifacts of different character (narrative doc +
machine-readable data) and #499's later milestones will likely add more
docs to the same epic (e.g. the `runStorageOp` design itself, or a
per-domain migration checklist) — a flat single file would need renaming or
splitting at that point anyway.

### 4. Characterization test strategy per behavior class

- **`rethrow` (`getMember`)**: mock the underlying `db.collection().findOne`
  to reject; assert `storage.getMember(...)` rejects with the same error.
  Single test, single path — this is the simplest case and needs no special
  treatment.
- **`swallow` (`loadSpellById`)**: the interesting property isn't the return
  value alone, it's that two different underlying conditions produce the
  *same* observable result. Two tests: (a) mock `findOne` to reject, assert
  `loadSpellById` resolves to `null`; (b) mock `findOne` to resolve `null`
  (genuine not-found), assert it also resolves to `null`. A comment ties the
  two together, stating explicitly that this pins the current
  DB-error/not-found ambiguity as a known characteristic, not a design goal.
- **`mixed` (`loadCharacters`)**: three tests corresponding to the three
  code paths — (a) `characters_active` view query mock resolves normally →
  assert those results are returned; (b) view query mock rejects, fallback
  `characters` collection query mock resolves → assert fallback results are
  returned (proves the fallback actually engages, not just that *a* result
  came back); (c) view query mock rejects, fallback query mock also rejects
  → assert the method resolves to `[]` rather than throwing (proves the
  outer swallow catches the fallback's failure too). Mocking must use two
  independently-controllable `db.collection(name)` mocks keyed by collection
  name (`characters_active` vs `characters`) so path (b) can prove the
  *specific* fallback ran, not just that some result was returned by
  accident from a shared mock.

### 5. Where characterization tests live

Follow existing repo test-file conventions for `lib/storage.ts` coverage
(colocated `__tests__`/`*.test.ts` pattern already used elsewhere in the
repo) rather than introducing a new test directory — tasks.md will locate
the exact existing pattern and target path during implementation.

## Risks / Trade-offs

- [Risk] Inventory JSON drifts from `lib/storage.ts` as soon as either file
  changes (including this change's own PR, if later edits touch storage.ts
  incidentally). → Mitigation: `sourceLineCount` and `generatedAt` fields
  let a later consumer detect staleness by diffing against the current file;
  `plan.md` states explicitly that #499 must re-verify, not blindly trust,
  the inventory before designing against it.
- [Risk] Hand-classifying ~64 methods by behavior is manual and error-prone
  (a mis-classified `swallow` vs `mixed` method would mislead #499).
  → Mitigation: the three required characterization tests double as
  verification for those three entries; tasks.md should include a step to
  spot-check a sample of the remaining classifications against the actual
  source rather than trusting a single automated pass.
- [Risk] Mocking MongoDB's driver for the two-collection `loadCharacters`
  fallback path is more complex than the repo's typical single-collection
  mock and could be written in a way that doesn't actually exercise the
  fallback (e.g. both mocks resolving from the same stub, masking that the
  wrong collection was queried). → Mitigation: decision 4 above specifies
  per-collection-name mock control as a hard requirement, and test (b)'s
  assertion must check *which* collection's data came back, not just that
  data came back.
- [Trade-off] Restricting characterization tests to three methods (per
  #500's minimum) leaves ~61 methods' behavior inventoried but unpinned by
  tests. Accepted per explicit issue scope — `characterizationTest: null`
  entries in the inventory make the gap visible rather than hiding it.

## Migration Plan

Not applicable — this change adds new files only (`docs/storage-refactor/`
and new test files) and modifies no existing production or test behavior.
No deployment or rollback steps beyond normal PR merge.

## Open Questions

None outstanding — taxonomy, format, and location were confirmed by the
requester prior to this design being written (see proposal.md's Open
Questions section).
