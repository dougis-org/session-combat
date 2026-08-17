## GitHub Issues

- #500
- Parent tracking issue: #499

## Why

- Problem statement: `lib/storage.ts` (1294 lines, ~64 methods across a flat
  object plus a nested `savedContent` sub-object) has no characterization
  tests pinning its existing error-handling behavior. 33 methods rethrow
  caught DB errors; 24 swallow them (returning `null`/`[]`/`false` and only
  logging); a few do neither cleanly (e.g. `loadCharacters`'s nested
  try/catch with a view-fallback path). This inconsistency is currently
  unpinned by any test, so a refactor of the storage layer (#499) could
  silently change error semantics for any of the 36 dependent files without
  a single test failing.
- Why now: #499 (decomposing `lib/storage.ts` into per-domain repos with
  centralized error handling via a planned `runStorageOp` helper) cannot
  safely begin until current behavior — including its inconsistencies — is
  documented and pinned. This is explicitly the first milestone in that
  epic.
- Business/user impact: without this, the refactor risks turning a silent
  DB blip that today returns a misleading-but-harmless empty result (e.g.
  `loadSpellById` swallowing to `null`, indistinguishable from a real
  404) into an unhandled 500, or vice versa — turning a currently-loud
  failure (e.g. `getMember` rethrowing into `assertCampaignAccess`) into a
  silently wrong authorization decision. Neither direction is safe to
  introduce accidentally.

## Problem Space

- Current behavior: each `storage.*` method independently decides whether
  to catch-and-rethrow or catch-and-swallow on DB error. Confirmed via direct
  inspection of `lib/storage.ts`:
  - `loadSpellById` (line 649): swallows to `null`. `app/api/spells/[id]/route.ts`
    cannot distinguish a DB error from a real "not found" — both produce
    `404 Spell not found`.
  - `getMember` (line 955): rethrows. `lib/utils/campaign.ts`'s
    `assertCampaignAccess()` (line 11) calls it with no local try/catch, so
    the same class of DB failure that's silently swallowed for spells
    becomes an unhandled throw here.
  - `loadCharacters` (line 116): two-tier — the primary query against the
    `characters_active` view is wrapped in an inner try/catch that falls
    back to a direct query against `characters` with an explicit
    `deletedAt: null` filter; that fallback's own try/catch swallows to
    `[]`. Three distinct failure paths, one observable behavior.
  - `storage.savedContent` (lines ~993+): a nested sub-object, not a peer
    method on the flat `storage` object, with its own independent
    swallow/rethrow split (`list` swallows, `create`/`update`/`remove`
    rethrow). Any inventory that only counts flat methods will
    undercount or mis-scope this.
- Desired behavior (for this change only): existing behavior is not changed.
  The desired end-state is a machine-readable inventory of all 64+4 methods'
  current behavior, plus a fixed taxonomy other work (#499's `runStorageOp`)
  can design against, plus characterization tests proving the current
  (including inconsistent) behavior for the three methods above.
- Constraints:
  - No production code in `lib/storage.ts` may change as part of this
    change — see Non-Goals.
  - The taxonomy defined here is the first definition in the #499 chain;
    there is no prior taxonomy to reconcile against.
- Assumptions:
  - Mocking the MongoDB driver/collection layer (consistent with existing
    test patterns in this repo) is sufficient to force DB-error paths
    without a real database.
  - "Current behavior" is defined by what the code does today, not by what
    it should do — inconsistencies are pinned as-is, not fixed.
- Edge cases considered:
  - Methods with no try/catch at all (`no-try`) — DB errors propagate
    unhandled by construction; still worth inventorying so #499 knows which
    methods currently have zero defensive handling.
  - Methods where the "swallow" value is not `null`/`[]` but `false` or
    `undefined` (e.g. boolean-returning update/delete methods) — the
    taxonomy must capture the actual sentinel, not assume a single shape.
  - `loadCharacters`'s two-tier shape doesn't fit a binary swallow/rethrow
    label — it's the motivating example for a `mixed` category.

## Scope

### In Scope

- A complete inventory of all `storage.*` methods (flat + nested
  `savedContent`) as `docs/storage-refactor/inventory.json`, covering:
  method name, parent (null or `savedContent`), domain, behavior
  classification, error-return sentinel, source line, caller list,
  existing test coverage, and free-text notes.
- A short narrative doc, `docs/storage-refactor/plan.md`, explaining the
  taxonomy, how to read `inventory.json`, and pointing back to #499/#500.
- A fixed 4-value behavior taxonomy: `swallow`, `rethrow`, `mixed`,
  `no-try`.
- Characterization tests pinning current behavior for, at minimum:
  `loadSpellById` (swallow), `getMember` (rethrow), `loadCharacters`
  (mixed, three sub-paths: view succeeds; view throws → fallback
  succeeds; view throws → fallback throws → swallows to `[]`).
- For each of those three, tests must prove the *ambiguity itself* where
  relevant — e.g. for `loadSpellById`, a test asserting a thrown DB error
  and a genuine "no matching document" both resolve to `null`, not just a
  single happy-path pin.

### Out of Scope

- Characterization tests for the remaining ~61 methods beyond the three
  required ones (explicitly "ideally extend to all 64" but not
  non-negotiable per #500).
- Designing or implementing `runStorageOp` or any other #499 foundation
  work — this change only produces the taxonomy and inventory that work
  will consume.
- Fixing any of the identified inconsistencies (e.g. making `loadSpellById`
  rethrow, or `getMember` swallow) — that is explicitly reserved for later
  #499 milestones.

## What Changes

- New directory `docs/storage-refactor/` containing `plan.md` and
  `inventory.json`.
- New test file(s) under the existing test directory structure adding
  characterization tests for `loadSpellById`, `getMember`, and
  `loadCharacters`.
- No changes to `lib/storage.ts` or any other production file.

## Risks

- Risk: the inventory becomes stale the moment `lib/storage.ts` changes
  again (e.g. a new method added, or #499 begins moving methods into
  per-domain files).
  - Impact: `runStorageOp` design work could rely on an inventory that no
    longer matches the code, reintroducing the exact blind spot this
    change exists to close.
  - Mitigation: `plan.md` states the inventory is a point-in-time snapshot
    tied to a specific commit/line count of `lib/storage.ts`, and that
    #499's next milestone must re-verify (not blindly trust) the inventory
    before designing against it.
- Risk: characterization tests that pin *inconsistent* behavior could be
  misread later as "this is the desired behavior" rather than "this is
  what happens today."
  - Impact: a future contributor "fixes" the inconsistency by editing
    `lib/storage.ts` without realizing the tests were deliberately pinning
    a bug class, or conversely treats the pinned bug as sacred and refuses
    a legitimate fix.
  - Mitigation: each characterization test carries a comment stating it
    pins current (possibly buggy) behavior, not desired behavior, and
    references #499 as the place that behavior will be intentionally
    changed.
- Risk: mocking the MongoDB layer for `loadCharacters`'s two-tier
  view-then-fallback path is more involved than a single-collection mock
  and could be gotten subtly wrong (e.g. not actually exercising the
  fallback).
  - Impact: a test that appears to cover the fallback path but doesn't
    would give false confidence going into #499.
  - Mitigation: design.md specifies the exact mock sequencing needed to
    force the view query to throw before the fallback query runs.

## Open Questions

None — this change was preceded by an explore-mode session (`/opsx:explore`
against #500) in which the test-pinning approach, the JSON inventory format
and its `docs/storage-refactor/` location, and the taxonomy-ownership
question (confirmed: this change defines the taxonomy from scratch, nothing
in #499 predates it) were each raised and resolved by the requester before
this proposal was generated.

## Non-Goals

- Not a production refactor of `lib/storage.ts`.
- Not a decision about which behavior (swallow vs. rethrow) is "correct"
  per method — that judgment call belongs to a later #499 milestone informed
  by this inventory.
- Not full 64-method characterization test coverage — three methods are the
  non-negotiable minimum per #500.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
