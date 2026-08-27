## Context

`lib/storage.ts` is a 64-method "god object" (tracked epic: #499) where every
method independently decides whether to swallow or rethrow DB errors. #501
built a shared foundation for fixing this — `runStorageOp()` (wraps a DB call,
logs via `logStorageEvent`, and on any thrown error always rethrows a typed
`StorageError`, never swallows), plus `logStorageEvent()` and `StorageError`.
That foundation merged in PR #531, but **no method in `lib/storage.ts` calls
`runStorageOp` yet** — #504, the migration that was meant to wire it into the
content/reference domain (including this method), hasn't started.

`getNextSessionNumber(userId, campaignId)` is a correctness bug, not just an
unlogged failure: on DB error it returns `1`, which is indistinguishable from
the legitimate "this is the campaign's first session" result. A transient DB
blip during session creation can silently mis-number or collide with an
existing session #1.

Both call sites (`sessions/route.ts` POST, `sessions/active/route.ts` POST)
already wrap their entire handler body in a single try/catch that maps *any*
thrown error to one generic message + 500 status. That means today, a thrown
`StorageError` would already avoid an unhandled crash — but it would also be
indistinguishable from a validation bug, an auth failure, or any other
exception in the handler, which the requester has said is not good enough:
the response for this specific failure must be explicit.

## Goals / Non-Goals

**Goals:**
- Make `getNextSessionNumber` throw a `StorageError` on DB failure instead of
  returning a numeric sentinel.
- Make both call sites produce a distinguishable error response specifically
  for this failure, not the same generic message as any other handler error.
- Establish the first real, working example of `runStorageOp` wired into an
  existing `lib/storage.ts` method, since #504 will need a concrete pattern
  to follow rather than starting from the foundation alone.
- Prove via test that a DB failure cannot produce a session number that
  collides with an existing session.
- Eliminate the failure window in `sessions/active/route.ts` where a claimed
  `activeSessionId` could be left dangling with no corresponding
  `SessionLog` if session-number lookup fails after the claim.

**Non-Goals:**
- Migrating any other `lib/storage.ts` method (#504's scope).
- Changing `runStorageOp`/`logStorageEvent`/`StorageError` themselves.
- General storage-error-to-HTTP-error mapping infrastructure for all
  endpoints — only these two call sites are touched.
- Client/UI handling of the new error detail.

## Decisions

### 1. Wrap the existing query in `runStorageOp`, with no `isEmpty` classifier

```ts
async getNextSessionNumber(userId: string, campaignId: string): Promise<number> {
  return runStorageOp(
    { name: "getNextSessionNumber", collection: "sessionLogs" },
    async () => {
      const db = await getDatabase();
      const latest = await db
        .collection<SessionLog>("sessionLogs")
        .findOne({ userId, campaignId }, { sort: { sessionNumber: -1 } });
      return latest ? latest.sessionNumber + 1 : 1;
    },
  );
},
```

Why no `isEmpty`: `runStorageOp`'s `isEmpty` classifier exists to distinguish
a legitimate "not found" *result* (logged as `outcome: "not_found"`, still
returned normally) from an error. For this method, `latest === null` (empty
collection) is not a not-found condition to flag — it's folded into the
success value (`1`) inside `fn()` itself, same as it is today. There is no
result shape here that should be logged as `not_found`; every successful
completion of `fn()` is a genuine success. Passing an `isEmpty` here would
require returning the raw `latest` document instead of the computed number
and shifting the `+1`/`1` logic out to the caller — a larger, riskier change
to the method's return contract for no behavioral benefit.

**Reference-example caveat for #504**: this is why `getNextSessionNumber` is a
convenient *first* example (minimal `runStorageOp` usage, one call, no
classifier) but an incomplete one — it never exercises the `isEmpty` /
`not_found` branch. #504 will need at least one additional worked example
(e.g. `loadCampaignById`, which the foundation's own tests already model with
`isEmpty: (r) => r === null`) before treating "the `getNextSessionNumber`
pattern" as sufficient guidance for methods that do have a real not-found
case.

**Alternative considered**: leave the `try/catch` in place and manually call
`logStorageEvent` + throw `StorageError`. Rejected — that's exactly the
duplication `runStorageOp` exists to eliminate, and this change is explicitly
meant to validate `runStorageOp` on a real call site.

### 2. Catch `StorageError` at each call site and return an explicit response

Both routes currently do:

```ts
} catch (error) {
  console.error("Error creating session log:", error);
  return NextResponse.json({ error: "Failed to create session log" }, { status: 500 });
}
```

Add a targeted catch for the session-numbering step specifically, so its
failure is distinguishable from other failures in the same handler:

```ts
let sessionNumber: number;
try {
  sessionNumber = await storage.getNextSessionNumber(campaign.userId, campaignId);
} catch (error) {
  console.error("Error determining next session number:", error);
  return NextResponse.json(
    { error: "Failed to determine next session number", code: "SESSION_NUMBER_UNAVAILABLE" },
    { status: 503 },
  );
}
```

Why a dedicated try/catch around just this call, not a `StorageError`
`instanceof` check in the outer catch: the outer catch already wraps several
independent operations (`assertCampaignAccess`, `saveSessionLog`, etc.) that
can also throw `StorageError` internally once #504 lands — an `instanceof`
check in the shared catch couldn't tell *which* operation failed. Isolating
the call is simpler and stays correct as more of the handler migrates.

Why status `503` instead of `500`: a `StorageError` here specifically means
"the datastore didn't answer," which is a service-availability condition, not
a generic application error — `503 Service Unavailable` is the more accurate
signal to a client than the blanket `500` every other failure in the handler
uses. This is scoped to *this* failure only; it does not change the status
code any other path in these handlers returns.

`sessions/active/route.ts` gets the identical treatment (it has only the one
`getNextSessionNumber` call, no `sessionNumber` already provided in the
body).

**Alternative considered**: return the same `500` as everything else but add
a `code` field for the client to distinguish on. Rejected per explicit
direction to make the *failure itself* (not just an error body detail)
explicit — a distinct status code is unambiguous even to callers that only
check `response.status`.

### 3. No change to `sessions/route.ts`'s "explicit `sessionNumber` in body" path

When the caller supplies a valid `sessionNumber` in the request body,
`getNextSessionNumber` is never invoked — that branch is untouched by this
change.

### 4. Reorder `sessions/active/route.ts`: call `getNextSessionNumber` before claiming the active session slot

Today `claimActiveCampaignSession` (which sets `campaign.activeSessionId`)
runs *before* `getNextSessionNumber`. That ordering was harmless while
`getNextSessionNumber` never threw — but once it can throw, that order
creates a new failure window: a DB blip during `getNextSessionNumber` would
leave the campaign's `activeSessionId` claimed with no matching `SessionLog`
ever saved, effectively soft-locking that campaign's "start a session" button
until someone manually clears `activeSessionId` (the `DELETE` handler
requires `force=true` to clear a "session" that was never really created).

Fix: call `getNextSessionNumber` *before* `claimActiveCampaignSession`.
Nothing in `getNextSessionNumber` depends on the claim having happened — it
only needs `campaign.userId` and `campaignId`, both already available at that
point in the handler. Reordering removes the failure window entirely: if
`getNextSessionNumber` throws, the function returns before any campaign
mutation happens, so there's nothing to roll back.

```ts
const nextSessionNumber = await storage.getNextSessionNumber(campaign.userId, campaignId); // may throw

const logId = crypto.randomUUID();
const claimed = await storage.claimActiveCampaignSession(campaignId, campaign.userId, logId);
if (!claimed) {
  return NextResponse.json({ error: 'A session is already active' }, { status: 409 });
}

const log: SessionLog = {
  ...,
  sessionNumber: nextSessionNumber,
  ...
};
```

**Alternative considered**: keep the existing order and roll back the claim
(`setActiveCampaignSession(campaignId, userId, null)`) in the catch block if
`getNextSessionNumber` fails. Rejected — it's strictly more code, introduces
a second failure mode (the rollback call itself can fail), and reordering
achieves the same end state with no compensating action needed.

This reordering is scoped only to `sessions/active/route.ts` — it does not
apply to `sessions/route.ts`, which never calls `claimActiveCampaignSession`.

## Risks / Trade-offs

- [Risk] Treating this method as the #504 reference pattern could over-fit
  #504's design to a call site with no `isEmpty` case.
  → Mitigation: called out explicitly above and to be restated in #504's own
  design doc; not silently assumed.
- [Risk] Changing the HTTP status for this one failure path (500 → 503) could
  surprise a client that special-cases 500.
  → Mitigation: scoped to exactly this failure; all other error paths in
  both handlers keep returning 500 unchanged. 503 is the more semantically
  correct code for a datastore-unavailable condition and is a safe,
  additive distinction.
- [Risk] Duplication: the same "call `getNextSessionNumber`, catch, respond
  503" shape is written twice (once per route) rather than factored into a
  shared helper.
  → Mitigation: acceptable at two call sites; revisit if #504 introduces a
  third caller or a shared error-mapping utility.
- [Risk] Reordering `sessions/active/route.ts` (decision 4) changes the
  observable order of operations for that endpoint: a request that used to
  fail at `claimActiveCampaignSession` (409, "already active") for a
  concurrently-claimed session will still fail there, but requests now
  compute the session number slightly earlier in the handler.
  → Mitigation: no behavior-visible change for the happy path or the
  already-active-409 path; only the failure-window characteristics change,
  which is the point of the reorder.

## Migration Plan

No data migration. This is a code-only change:
1. Update `getNextSessionNumber` to use `runStorageOp`.
2. Update both call sites' error handling.
3. Ship behind normal PR review/CI — no feature flag needed since the only
   behavior change is what happens *during a DB failure*, not the happy path.
Rollback: revert the PR; no persisted state to unwind.

## Open Questions

None outstanding — the three ambiguities identified during exploration
(reference-example scope, degenerate `isEmpty` usage, explicit-failure-status
expectation) are resolved by decisions 1–2 above.
