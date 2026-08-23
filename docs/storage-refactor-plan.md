# Storage Layer Refactor — Plan

Tracking issue: [#499](https://github.com/dougis-org/session-combat/issues/499)
Project board: [Session Combat (#7)](https://github.com/orgs/dougis-org/projects/7)

## 1. Background

A knowledge-graph analysis of this repository surfaced `lib/storage.ts` as its
single highest-connectivity file: a 64-method object imported by **36 non-test
files (125 call sites)** and mocked directly by **11 test files**. Every method
independently wraps its own `try/catch` around `getDatabase()` (`lib/db.ts`),
and the catch behavior is inconsistent:

- **33 methods rethrow** the caught DB error.
- **24 methods swallow it** — log via `console.error`/`console.warn` and return
  a sentinel `null`/`[]`/`undefined`.
- A handful do neither cleanly (e.g. `loadCharacters` has a nested try/catch
  with a view-fallback path).

This is a real, currently-shipping bug class:

- `storage.loadSpellById()` **swallows** — so `app/api/spells/[id]/route.ts`
  reports a genuine MongoDB outage identically to a legitimate 404
  `"Spell not found"`.
- `storage.getMember()` **rethrows** — so `lib/utils/campaign.ts`'s
  `assertCampaignAccess()` (called by nearly every campaign-scoped route) lets
  the same failure class propagate as an unhandled 500 instead.

Two routes, same failure mode, two different wrong outcomes — and no
structured log line distinguishes either from a routine not-found case. There
is no logging/telemetry abstraction anywhere in this repo today; `storage.ts`
alone has 64 ad hoc `console.error`/`console.warn` call sites with no
structured fields (op name, collection, duration, outcome), so none of this
can currently be dashboarded or alerted on.

## 2. Accepted design decisions

Recorded in this repo's knowledge base (`.verity/memory/decisions/`):

- **Decompose storage by domain behind a stable facade** — storage domains may
  be split into focused per-domain modules, but the public `storage` object
  export must remain stable while the 36 callers and 11 test mocks depend on
  it. This enables the god-object decomposition without forcing a
  repository-wide migration or breaking existing mocks.
- **Route storage events through one logging seam** — storage-related
  operational events must pass through a shared logging seam
  (`logStorageEvent`) rather than being emitted independently by each method.
  This preserves one integration point for consistent event shape and error
  context, and allows metrics or OpenTelemetry exporters to be added later
  without revisiting every storage method.

## 3. Epic and milestones

| Issue | Title | Phase | Size | Blocked by |
|---|---|---|---|---|
| [#499](https://github.com/dougis-org/session-combat/issues/499) | tracking: refactor `lib/storage.ts` god object into per-domain repos with centralized error handling and telemetry (epic) | — | XL | — |
| [#500](https://github.com/dougis-org/session-combat/issues/500) | Blast-radius inventory + characterization tests | Foundation | S | none |
| [#501](https://github.com/dougis-org/session-combat/issues/501) | `runStorageOp` + `logStorageEvent` + `StorageError` foundation | Foundation | S | #500 |
| [#502](https://github.com/dougis-org/session-combat/issues/502) | Migrate core session-state domains (encounters, characters, combatState, parties — 19 methods) | Migration | M | #501 |
| [#503](https://github.com/dougis-org/session-combat/issues/503) | Migrate campaign/template domains (monsterTemplates, campaignTemplates, campaigns, membership — 27 methods) | Migration | L | #501 |
| [#504](https://github.com/dougis-org/session-combat/issues/504) | Migrate content/reference domains (sessionLogs, shares, spells, rolls, misc — 18 methods) | Migration | M | #501 |
| [#505](https://github.com/dougis-org/session-combat/issues/505) | Swap logging seam to OpenTelemetry | Telemetry | S | #502, #503, #504 |
| [#506](https://github.com/dougis-org/session-combat/issues/506) | Migrate callers off the storage facade to narrow imports (**optional**) | Stretch | L | #502, #503, #504 |

All seven milestones are linked to #499 as native GitHub sub-issues. #506 is
explicitly optional — the epic is considered complete without it.

The migration split for #502/#503/#504 is **by domain cluster** (what part of
the app each group gates: session/combat runtime, campaign/template
administration, content/reference lookups) rather than by swallow-vs-rethrow
bug class or raw call-count. This keeps each PR's manual-QA scope coherent — a
reviewer testing one milestone only needs to exercise one feature area.

## 4. Dependency graph

```
#500 (inventory + characterization tests)
  └─ blocks → #501 (runStorageOp/logStorageEvent/StorageError foundation)
                ├─ blocks → #502 (session-state migration)
                ├─ blocks → #503 (campaign/template migration)
                └─ blocks → #504 (content/reference migration)
                              [#502, #503, #504 mutually independent — parallelizable]
                                ├─ blocks → #505 (OTel swap)
                                └─ blocks → #506 (caller migration, optional)
                              [#505, #506 independent of each other]
```

Dependencies are expressed as explicit "Blocked by #N" text in each issue body
(per this repo's `.github/agents/find-next-ticket.agent.md` convention —
labels and milestones alone do not create dependencies), plus native GitHub
sub-issue parent/child links from #499 to each milestone.

## 5. Project board field design

Reusing the existing **"Session Combat" project (#7)** rather than creating a
new board. Existing fields reused as-is:

- `Status` — set to `Backlog` on creation for all 8 issues (existing options:
  Backlog / Ready / In progress / In review / Done).
- `Size` — `XS`/`S`/`M`/`L`/`XL` per the table above.

One new field added:

- `Phase` (single-select: `Foundation`, `Migration`, `Telemetry`, `Stretch`) —
  feeds the tie-break rule in `find-next-ticket.agent.md`
  (milestone/phase → priority label → issue number).

The existing `Priority` field was left alone (no established option set); M0
and M1 instead carry the existing `critical` **label**, consistent with how
priority is already signaled elsewhere in this repo. No native GitHub
Milestone object was created — the "milestones under a parent issue"
structure is better modeled by sub-issues (real hierarchy) than by GitHub
Milestones (a flat, non-hierarchical bucket).

## 6. OpenSpec change mapping

One OpenSpec change per milestone, proposed via `/openspec:explore #<N>` then
`/openspec:propose` **only as that milestone is actually started** — not
pre-scaffolded. The `sdd-with-feedback-loop` schema creates a dedicated
worktree and branch per change; pre-scaffolding all seven now would create
stale, unreviewed artifacts and orphaned branches before any of the work is
staffed. This matches the repo's own documented flow (issue → self-assign →
explore → propose → apply → archive).

| Milestone | OpenSpec change slug | Status |
|---|---|---|
| #500 | `storage-blast-radius-inventory` | Applied |
| #501 | `storage-runop-telemetry-foundation` | Applied |
| #502 | `storage-migrate-session-state-domains` | Not started |
| #503 | `storage-migrate-campaign-template-domains` | Not started |
| #504 | `storage-migrate-content-reference-domains` | Not started |
| #505 | `storage-otel-telemetry-swap` | Not started |
| #506 | `storage-caller-narrow-imports` (optional) | Not started |

Update the Status column (Not started / Explored / Proposed / Applied /
Archived) as each milestone's OpenSpec change progresses.

## 7. Sequencing note

Only the epic, seven milestone issues, and this plan document were created in
the initial planning session. No `openspec/changes/*` folders exist yet — by
design, not an oversight. The first OpenSpec change
(`storage-blast-radius-inventory`) should be opened via `/openspec:explore
#500` whenever #500 is picked up.

## 8. Changelog

- **2026-08-16** — Initial plan: epic #499, milestones #500–#506 created and
  linked as native sub-issues; added to project #7 with `Status`/`Phase`/`Size`
  set; this document created.
- **2026-08-17** — #500 (`storage-blast-radius-inventory`) merged and archived;
  blast-radius inventory and characterization tests landed.
- **2026-08-23** — #501 (`storage-runop-telemetry-foundation`) merged via
  [#531](https://github.com/dougis-org/session-combat/pull/531); `runStorageOp`,
  `logStorageEvent`, and `StorageError` foundation added under
  `lib/storage/` and `lib/telemetry/`. Unblocks #502, #503, #504, and #527.
