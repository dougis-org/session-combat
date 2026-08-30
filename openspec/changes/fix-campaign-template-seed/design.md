## Context

Currently, the `lib/scripts/seedCampaignTemplates.ts` script seeds initial campaign template data into the database. To prevent accidentally wiping out or resetting live campaign structures that users may have modified, the script checks if a campaign exists and skips seeding it.
However, as new campaign content (e.g., new encounters) is added to the templates, this skipping behavior prevents those updates from syncing. A mechanism is required to force an update on existing campaigns safely.

## Goals / Non-Goals

**Goals:**
- Provide a safe way to update existing campaign templates with new content.
- Support a `--force` CLI flag in the seed script that opts in to an upsert operation.
- Preserve the default behavior of skipping existing templates to prevent accidental overwrites in standard workflows.
- Provide documentation on how to update seed data safely.

**Non-Goals:**
- Complete migration of all database seeding to a new ORM or framework.
- Auto-syncing of changes without explicit developer action.

## Decisions

- **CLI Flag parsing:** We will parse `process.argv` to look for a `--force` flag. This avoids needing external dependencies just for one flag.
- **Database operation:** When `--force` is provided, instead of a skip, we'll use `updateOne` with `{ $set: campaign }` and `{ upsert: true }`. This guarantees the document matches the latest template definition while preserving any other untouched fields if they exist (though typically templates are overwritten).
- **Update documentation:** A small markdown section will be added to `AGENTS.md`, `README.md` or a `scripts/README.md` (if it exists) directing how to execute `npm run seed -- --force`.

## Risks / Trade-offs

- **Risk**: Forcing an update could overwrite legitimate modifications if templates are mistakenly used for active gameplay instead of as structural references.
  - **Mitigation**: The `--force` flag ensures this is an explicit, opt-in action. We will also log a prominent warning when the flag is used.
- **Risk**: Missing fields in the seed definition might not properly remove fields in the database.
  - **Mitigation**: This is acceptable for now. If exact mirroring is required, we can switch to `$set` combined with `$unset`, but `$set` covers the new content needs (like adding encounters).
