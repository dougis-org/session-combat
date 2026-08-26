## GitHub Issues

- #527

## Why

- Problem statement: `storage.getNextSessionNumber()` in `lib/storage.ts` catches
  DB errors and returns `1` — the exact same value it legitimately returns for a
  campaign's real first session. A transient DB failure during session-log
  creation is therefore indistinguishable from "this is session #1," and can
  silently produce a session numbered `1` that collides with or duplicates an
  existing session #1 for that campaign.
- Why now: this is an active correctness bug (data corruption risk), not just a
  masked/logged error like the other methods tracked under #499. It was
  isolated into its own issue specifically so it doesn't get lost inside the
  broader #504 migration and gets explicit "throws instead of mis-numbering"
  test coverage.
- Business/user impact: a DM using session logging during a DB blip could get a
  session silently renumbered/duplicated as #1, corrupting session
  ordering/history for that campaign with no visible error at the time it
  happened.

## Problem Space

- Current behavior: `getNextSessionNumber` wraps its query in try/catch;
  on any thrown error it logs via `console.error` and returns `1`.
- Desired behavior: on DB failure, `getNextSessionNumber` throws a
  `StorageError` (via the `runStorageOp` foundation from #501) instead of
  returning a sentinel number. Both call sites must respond with a
  distinguishable failure rather than a generic 500 indistinguishable from
  any other error.
- Constraints:
  - #501 (the `runStorageOp` / `logStorageEvent` / `StorageError` foundation)
    is merged (PR #531) but has **zero production call sites** today — this
    change is the first method in `lib/storage.ts` to actually use it.
  - #504 (the broader content/reference domain migration that was originally
    scoped to cover this method) has not started.
- Assumptions:
  - Because this is the first real call site, this change is being treated as
    the **reference example** for how `runStorageOp` gets wired into an
    existing `lib/storage.ts` method — the pattern established here is
    expected to guide #504, not just fix this one method.
  - `getNextSessionNumber` has no legitimate "not found" case distinct from
    success: `latest === null` (empty collection) is a normal, successful
    result (session number 1), not an absence to be flagged via `isEmpty`.
    So this call site is a simple pass-through of `runStorageOp`'s result with
    no `isEmpty` needed — it won't exercise `runStorageOp`'s not-found branch.
- Edge cases considered:
  - Empty collection (campaign's true first session) → must still return `1`,
    unchanged from today.
  - DB failure with an existing session #1 already present → must not return
    `1` again; must throw instead.
  - Both callers (`sessions/route.ts` POST, `sessions/active/route.ts` POST)
    already wrap their full handler body in try/catch that maps any thrown
    error to a generic message + 500. A thrown `StorageError` will be caught
    there today, so "no unhandled 500 masking" is trivially satisfied — but
    per explicit direction, the response body for this failure must be made
    distinguishable rather than left as the same generic message every other
    unrelated failure in that handler produces.

## Scope

### In Scope

- Migrate `lib/storage.ts`'s `getNextSessionNumber` to use `runStorageOp`,
  throwing `StorageError` on DB failure instead of returning `1`.
- Update both call sites (`app/api/campaigns/[id]/sessions/route.ts`,
  `app/api/campaigns/[id]/sessions/active/route.ts`) to catch `StorageError`
  specifically for this call and return an explicit, distinguishable error
  response (not the same generic "Failed to create session log" /
  "Failed to open active session" message used for unrelated failures).
- Unit test proving a DB failure does not produce a session numbered the same
  as an existing session (throws instead of returning a colliding number).
- Documenting this method's migration as the reference pattern for #504
  (a short note in `design.md`, not a rewrite of #504's own artifacts).

### Out of Scope

- Migrating any other method in `lib/storage.ts` to `runStorageOp` (that's
  #504's broader scope — this change only proves the pattern on one method).
- Changes to `runStorageOp`, `logStorageEvent`, or `StorageError` themselves
  (#501 is closed; this change consumes that foundation as-is).
- Client-side (UI) handling of the new distinguishable error — only the API
  response shape is in scope; adjusting how the frontend surfaces it is a
  separate concern unless trivial.
- Retry/backoff logic for the underlying DB call.

## What Changes

- `lib/storage.ts`: `getNextSessionNumber` wraps its query in `runStorageOp`
  and no longer swallows errors into a `1` return.
- `app/api/campaigns/[id]/sessions/route.ts`: distinguishes a
  `getNextSessionNumber` `StorageError` from other failures and returns an
  explicit error response for it.
- `app/api/campaigns/[id]/sessions/active/route.ts`: same distinguishing
  treatment.
- New/updated unit tests covering the throw-on-failure behavior and the
  no-collision guarantee.

## Risks

- Risk: Establishing this as the "reference example" for #504 before #504 is
  scoped/designed could bake in a pattern that turns out not to generalize to
  methods that *do* have legitimate not-found cases.
  - Impact: #504 might need to deviate from this exact pattern for other
    methods, or this change's approach may need revisiting once #504 starts.
  - Mitigation: `design.md` explicitly notes this method is a degenerate
    case (no `isEmpty` branch exercised) so #504 authors don't assume every
    method looks like this one.
- Risk: Making the API error response "explicit" for this one failure path
  changes response shape/status for these two endpoints in a way clients may
  not yet handle.
  - Impact: frontend callers that only check `response.ok` are unaffected;
    callers parsing the error body for a specific generic shape could see a
    new field/message.
  - Mitigation: keep the HTTP status code unchanged (500) and only add
    distinguishing detail (e.g. an error code/message field), rather than
    changing status semantics.

## Open Questions

- Question: none outstanding — the three ambiguities raised during
  `/opsx:explore` (reference-example scope, degenerate `isEmpty` usage, and
  explicit-failure-response expectations) were resolved directly by the user
  in this session before requesting the proposal.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Building a general "storage error → API error code" mapping layer for all
  endpoints; this change only makes the two `getNextSessionNumber` call sites
  distinguishable.
- Preventing DB outages or adding resilience beyond correct error propagation.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
