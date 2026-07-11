## GitHub Issues

- #479

## Why

- Problem statement: `POST /api/campaigns` was changed (#474) to auto-create a default "Main Party" linked to every new campaign. That only covers campaigns created after #474 shipped — campaigns that already existed have no party.
- Why now: the epic goal (#470) is deprecating `CampaignCharacterShare` in favor of party-level sharing. Every campaign eventually needs at least one party for that flow to land in. Pre-existing campaigns without a party will have nowhere for shared characters to go once that migration happens.
- Business/user impact: users with campaigns created before #474 will hit a dead end (no party to share characters into) once party-level sharing replaces `CampaignCharacterShare`. Backfilling now removes that blocker ahead of time, independent of when the sharing migration actually ships.

## Problem Space

- Current behavior: campaigns created via `POST /api/campaigns` after #474 always get exactly one `Party` (`name: 'Main Party'`, `members: []`, `campaignId` set, `userId` = campaign owner). Campaigns created before #474 have zero `Party` documents referencing them.
- Desired behavior: every campaign in the `campaigns` collection has at least one associated `Party` document (`parties.campaignId` matches `campaigns.id`). A one-off script finds campaigns with none and creates a default "Main Party" for each, matching the shape #474 already produces.
- Constraints:
  - Must not touch campaigns that already have at least one party (including ones with more than the default, e.g. manually created extra parties).
  - Must not alter `Campaign` documents — only inserts new `Party` documents.
  - Runs as a manual, one-off script (`lib/scripts/`), not wired into deploys, migrations, or CI.
  - Must reuse the exact `Party` shape from `app/api/campaigns/route.ts` (`lib/types.ts` `Party` interface) so backfilled parties are indistinguishable from ones #474 creates.
- Assumptions:
  - Every `Campaign` document has a valid `userId` to own the new `Party`.
  - Campaign volume is small enough (hundreds/low-thousands) that a single aggregation query is sufficient — no batching/pagination needed.
  - Script is run manually against a target environment's database (dev/staging/prod) by a human, not automated.
- Edge cases considered:
  - Campaign with zero parties → gets one default party (the main case).
  - Campaign with one or more parties already (whether from #474 or created manually) → skipped entirely.
  - Script run twice in a row → second run is a no-op (idempotent), since the query re-checks "no party" each time.
  - Empty `campaigns` collection or no campaigns missing a party → script logs zero backfilled and exits cleanly.

## Scope

### In Scope

- A new one-off script under `lib/scripts/` that:
  - Queries for campaigns with no matching `Party` (`campaignId` not present in `parties`).
  - Creates one default "Main Party" per such campaign, owned by that campaign's `userId`.
  - Logs per-campaign backfill lines plus a final summary count.
- Confirming the created `Party` shape matches `app/api/campaigns/route.ts`'s auto-create logic exactly.

### Out of Scope

- Any change to `POST /api/campaigns` or the #474 auto-create logic itself.
- Adding a `dm` campaign member row (existing campaigns already have their membership rows; only the `Party` is missing).
- Wiring this script into deploy/migration automation, CI, or a repeatable admin command.
- Any change to `CampaignCharacterShare` or the broader party-level sharing migration (#470 epic) — this is purely a data-backfill prerequisite.
- Deleting or archiving the script after it's run (see Non-Goals).

## What Changes

- Add `lib/scripts/backfillDefaultParties.ts` (naming to be finalized in design): a standalone script, run via `npx tsx` or equivalent (matching how `lib/scripts/seedCampaignTemplates.ts` is invoked), that backfills missing default parties for pre-existing campaigns.

## Risks

- Risk: aggregation/query logic incorrectly identifies campaigns as "missing a party" (e.g. due to `campaignId` type mismatch between `Campaign.id` and `Party.campaignId`).
  - Impact: could create duplicate "Main Party" documents for campaigns that already have one, confusing users with two default parties.
  - Mitigation: match the exact field types already used by `app/api/campaigns/route.ts` and add a dry-run/log-only mode (or at minimum clear per-campaign logging) so the script's findings can be eyeballed before it's trusted; verify against a small dataset first.
- Risk: script is run against the wrong environment (e.g. prod when dev was intended).
  - Impact: unwanted writes to a live database.
  - Mitigation: script relies on the same `getDatabase()` / connection-string configuration as the rest of the app, so it targets whatever environment the operator's env vars point to — this is a manual/human-judgment risk, not something the script can fully prevent, but it should log which database/connection it's operating against before writing.

## Open Questions

- Question: should the script support a `--dry-run` flag to preview affected campaigns before writing, or is per-campaign console logging during the real run sufficient?
  - Needed from: Doug
  - Blocker for apply: no (default to logging-only during the real run, no dry-run flag, unless told otherwise)

## Non-Goals

- This script is explicitly deletable after it has been run successfully against all relevant environments — unlike `seedCampaignTemplates.ts`, it is not intended to be kept indefinitely as a standing tool. Deletion itself is a manual follow-up step for a human, not something this change automates.
- Not building a general-purpose "campaign data integrity checker" — this only targets the one known gap (missing default party).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
