## Why

GitHub issue #110 asks for the D&D Beyond importer to accept a public character URL when the system can access and parse the data, even if that URL does not match a known path shape. The current flow still assumes a specific URL structure before it attempts import, which blocks valid public character pages from being used directly.

This change removes that assumption so the importer behaves like a fetch-and-parse pipeline: if the URL is publicly accessible and yields importable character data, the import should proceed.

## Problem Space

The current import experience is too strict about URL shape. Users can hit a valid public D&D Beyond character page, but the system still rejects it if it does not look like the expected share-link format.

The desired behavior is access-based, not shape-based:

- If the system can fetch the URL and parse valid character data, the URL should be accepted.
- If the system cannot access the URL or cannot parse importable data from it, the import should fail with a clear error.
- The user-visible source URL should remain exactly what the user entered because it is transient display data, not a canonical identifier.

## What Changes

- Update D&D Beyond import validation so the system accepts any publicly available URL that can be fetched and parsed into character data.
- Remove shape-based assumptions from the acceptance path.
- Keep existing duplicate-name and overwrite behavior unchanged.
- Update the import UI copy to tell users to provide a publicly available URL.
- Preserve the exact entered URL in transient display state and response data.
- Add tests for successful import from an accessible URL, failure when the URL cannot be accessed or parsed, and verbatim URL display behavior.

## Capabilities

### Modified Capabilities
- `dnd-beyond-character-import`: change URL acceptance from path-shape validation to access-and-parse validation, while preserving existing normalization, duplicate handling, and overwrite behavior.

### New Capabilities
- None.

## Scope

In scope:

- Accepting any publicly available URL that yields importable D&D Beyond character data
- Rejecting only URLs that cannot be accessed or parsed into valid import data
- Updating the import form copy so it asks for a publicly available URL
- Preserving the exact user-entered URL in transient display state
- Updating tests to cover the new acceptance and failure model

Out of scope:

- Importing private or authenticated-only characters
- Changing duplicate-name overwrite semantics
- Reworking the local character model or normalization rules beyond what is needed to support the new acceptance path
- Adding ongoing sync with D&D Beyond after import

## Non-Goals

- Canonicalizing or rewriting the user-entered URL for display purposes
- Treating URL path structure as the source of truth for acceptance
- Expanding import support to non-public or authenticated-only D&D Beyond data

## Risks

- D&D Beyond response shapes may vary over time, so parser logic must fail cleanly when it cannot extract importable data.
- Showing the raw entered URL requires care to avoid accidentally mutating the transient display state during form handling.
- Relaxing shape assumptions can widen the accepted input surface, so the error path must stay explicit for inaccessible or unparsable URLs.

## Open Questions

No open questions remain for proposal scope. The acceptance rule is now defined: if the system can access the URL and parse the data, it should accept it.

## Change Control

If scope changes after approval, `proposal.md`, `design.md`, `specs/`, and `tasks.md` must be updated before `/opsx:apply` proceeds.