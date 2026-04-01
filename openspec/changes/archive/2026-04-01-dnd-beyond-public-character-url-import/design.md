## Context

The existing D&D Beyond import flow still treats URL structure as part of validation. That is too restrictive for this change because the intended contract is now access-based: the system should accept a URL when it can fetch and parse character data from it.

The impact is limited but cross-cutting. The import route, the server-side importer, the characters page import UI, and the associated tests all need to agree on the new behavior.

## Goals / Non-Goals

**Goals:**
- Accept any publicly available URL that the system can fetch and parse into D&D Beyond character data.
- Preserve the exact URL entered by the user in transient display state.
- Update the UI copy so users understand they must provide a publicly available URL.
- Preserve existing normalization, duplicate-name conflict handling, and overwrite behavior.

**Non-Goals:**
- Supporting private or authenticated-only D&D Beyond characters.
- Canonicalizing or normalizing the user-entered URL for display.
- Changing the character model or duplicate-name semantics.

## Decisions

### 1. Acceptance will be driven by access and parse success, not by path shape

The importer should treat the submitted URL as opaque input and attempt to fetch and parse data from it. A URL is accepted when the system can retrieve importable character data; it is rejected when access or parsing fails.

Alternatives considered:
- Shape-based validation of known D&D Beyond URL patterns. Rejected because it still assumes the URL structure is the contract and would block valid public URLs that do not match the expected path.
- Client-side validation first. Rejected because access and parse success are authoritative only on the server.

### 2. The submitted URL will be preserved verbatim for transient display

The UI should keep the user-entered URL as the source string shown back to the user during import flow states. This string is transient UI data, so it should not be canonicalized into a display-only variant.

Alternatives considered:
- Rewrite the display URL to a canonical form. Rejected because the user asked for the entered value to remain the display value, and canonicalization provides no practical benefit here.

### 3. Import failures will stay explicit and user-actionable

The server should continue to map inaccessible or unparsable URLs to a clear import failure. The UI can then surface a direct message instead of leaving the user with an ambiguous validation error.

Alternatives considered:
- Silent fallback to another URL shape or page variant. Rejected because it obscures the actual source of failure and increases the chance of importing the wrong data.

### 4. Existing normalization and duplicate handling remain unchanged

This change is intentionally scoped to input acceptance and user-facing URL handling. The imported character normalization pipeline and duplicate-name overwrite behavior should remain as-is.

Alternatives considered:
- Folding import acceptance changes into normalization. Rejected because it couples unrelated concerns and increases regression risk.

## Risks / Trade-offs

- [Risk] D&D Beyond may alter accessible page behavior or response structure → [Mitigation] keep the server failure path explicit and validate through tests that use live-shaped fixtures.
- [Risk] Preserving raw input could accidentally display whitespace or malformed text → [Mitigation] keep the displayed source string separate from any submission-time trim/validation step.
- [Risk] Relaxing shape checks can broaden the accepted surface area → [Mitigation] require successful fetch and parse before import is accepted.

## Migration Plan

No data migration is required. This is a behavior change at the import boundary.

Deployment plan:
1. Update the import UI copy and state handling.
2. Update the server import path to treat access/parse success as the acceptance gate.
3. Run the focused tests covering success, access failure, parse failure, and UI display behavior.
4. Merge behind the existing import route.

Rollback plan:
- Revert the change if access-based acceptance introduces regressions or if D&D Beyond response handling proves unstable.

## Open Questions

No open questions remain. The acceptance rule is explicit: if the system can access the URL and parse the data, the import should proceed.

## Proposal-to-Design Mapping

- Access-based acceptance → server-side fetch-and-parse gate instead of path-shape validation.
- Publicly available URL copy → UI text and validation messaging.
- Verbatim source display → transient UI state preserves the user-entered URL.
- Existing import semantics unchanged → duplicate-name and normalization behavior stay intact.

## Operational Blocking Policy

If CI, review, or security checks block the change, pause merge and fix the blocking issue before proceeding. Do not widen scope to unrelated importer behavior unless the blocker requires it.