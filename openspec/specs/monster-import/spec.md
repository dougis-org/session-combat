# monster-import Specification

## Purpose

Let any authenticated user bulk-import monsters into their library from a
JSON file via an in-context modal on `/monsters`, with a downloadable
structure document, a pre-commit preview (count + names), server-enforced
admin control over Global vs. personal scope, duplicate skipping, and an
all-or-nothing ingestion outcome (no partially-applied import), all driven by
a single Zod schema so validation, transform, and the structure document
cannot drift from each other.

## Requirements

### Requirement: Import entry point on the monster library

The system SHALL present an `Import Monster(s)` control on the `/monsters` page to every authenticated user, regardless of admin status, that opens the monster import modal without navigating away from the page.

#### Scenario: Any authenticated user sees the import control

- **Given** an authenticated non-admin user viewing `/monsters`
- **When** the page finishes loading
- **Then** an `Import Monster(s)` button is visible alongside `Add New Monster`
- **And** activating it opens a modal dialog while the URL stays `/monsters`

#### Scenario: Closing the modal leaves no state

- **Given** the import modal is open with a file selected and a preview shown
- **When** the user closes the modal without confirming
- **Then** no monster records are created
- **And** re-opening the modal shows the initial (idle) state with no file selected

### Requirement: Downloadable import structure document

The system SHALL expose, from the import modal, both a human-readable list of every non-calculated monster field with its required/optional status and a downloadable example JSON file, all derived from the single upload schema so they cannot drift from validation.

#### Scenario: Field list is shown with required markers

- **Given** the import modal is open
- **When** the user views the structure section
- **Then** every field accepted by the upload schema is listed with its type
- **And** each field is marked required or optional consistent with the schema
- **And** no calculated field (e.g. experience points derived from challenge rating) appears in the list

#### Scenario: Example file download

- **Given** the import modal is open
- **When** the user activates the "download the required JSON structure" link
- **Then** a JSON file is downloaded whose top level is an array containing one monster object populated with every field
- **And** that file passes validation if re-uploaded unchanged

### Requirement: Whole-file validation before preview

The system SHALL validate the entire uploaded document server-side before showing any preview, accepting only a top-level JSON array (or an object with a `monsters` array) of one or more monster objects, and SHALL report all validation failures with a field path and message.

#### Scenario: Valid file produces a preview payload

- **Given** an authenticated user has selected a JSON file containing 12 valid monsters
- **When** the file is submitted for validation
- **Then** the response is HTTP 200 with `count` equal to 12 and `names` listing all 12 monster names in file order

#### Scenario: Empty array is rejected

- **Given** a selected file whose top-level array has zero elements
- **When** the file is submitted for validation
- **Then** the response is HTTP 400
- **And** the modal shows an error stating at least one monster is required
- **And** no preview is shown

#### Scenario: Malformed JSON is rejected before any request

- **Given** a selected file that is not parseable as JSON
- **When** the user submits it
- **Then** the modal shows a parse error
- **And** no import or validation request is sent

#### Scenario: Missing required field is reported by path

- **Given** a file where `monsters[3]` omits the required `abilityScores` field
- **When** the file is submitted for validation
- **Then** the response is HTTP 400 with an error entry whose field is `monsters[3].abilityScores`
- **And** the modal renders that field path and message

#### Scenario: Unknown fields are stripped, not rejected

- **Given** a file where a monster object contains an extra unrecognized key
- **When** the file is validated and later imported
- **Then** validation succeeds
- **And** the stored monster record does not contain the extra key

### Requirement: Import preview

The system SHALL show the total number of monsters to be imported and the list of their names after successful validation and before any monster is written.

#### Scenario: Preview lists count and names

- **Given** a file of 5 valid monsters has been validated
- **When** the preview step renders
- **Then** it shows "5" as the count and lists all 5 names
- **And** a `Confirm` action and a `Cancel` action are available

### Requirement: Import scope selection

The system SHALL default every import to the current user's personal library, SHALL offer a whole-batch choice between Personal and Global only to admin users, and SHALL verify admin status server-side before writing any Global monster, rejecting a Global request from a non-admin.

#### Scenario: Non-admin has no scope choice and imports personally

- **Given** an authenticated non-admin user at the preview step
- **When** the preview renders
- **Then** no Global/Personal choice is shown
- **And** confirming creates monsters with the user's own `userId` and `isGlobal` false

#### Scenario: Admin imports to the Global library

- **Given** an authenticated admin user who selected `Global` at the preview step
- **When** the user confirms the import
- **Then** each created monster has `userId` equal to the global user id and `isGlobal` true

#### Scenario: Forged Global request from a non-admin is denied

- **Given** an authenticated non-admin user
- **When** an import request is sent with scope `global`
- **Then** the response is HTTP 403
- **And** no monster records are created

### Requirement: Duplicate handling on import

The system SHALL skip monsters whose name and source already exist within the target library, SHALL also collapse repeated name+source entries within the uploaded file to a single import (first occurrence wins), SHALL return the skipped names to the caller, and SHALL treat an import that inserts zero monsters because all were duplicates as a success.

#### Scenario: Existing monster is skipped and reported

- **Given** the target library already contains a monster named "Goblin" with source "SRD"
- **And** the uploaded file contains a monster named "Goblin" with source "SRD" plus 4 new monsters
- **When** the user confirms the import
- **Then** the response is HTTP 200 with 4 inserted names and `skippedDuplicates` containing "Goblin"
- **And** the library contains exactly one "Goblin" with source "SRD"

#### Scenario: In-file repeated monster is imported once

- **Given** an uploaded file that lists the same name+source monster twice and no other rows
- **When** the user confirms the import
- **Then** exactly one monster is created
- **And** the repeated name appears in `skippedDuplicates`

#### Scenario: All-duplicates import succeeds with zero inserts

- **Given** every monster in the uploaded file already exists in the target library
- **When** the user confirms the import
- **Then** the response is HTTP 200 with an empty inserted list
- **And** `skippedDuplicates` lists every monster name
- **And** the modal reports success, not an error

### Requirement: Atomic-ish ingestion with revert on failure

The system SHALL validate the entire batch and resolve all duplicates before writing any monster, SHALL insert the surviving monsters in a single bulk operation, and on any ingestion error SHALL delete every monster it inserted for that batch and report the load as reverted, so that the user never observes a partially-applied import.

#### Scenario: Mid-ingestion failure reverts the batch

- **Given** a validated batch of 10 non-duplicate monsters
- **And** the bulk insert operation raises an error
- **When** the import request is processed
- **Then** the system attempts to delete all monsters it inserted for the batch
- **And** the response reports `reverted` true and includes the error detail
- **And** after the request the target library contains none of the 10 monsters

#### Scenario: Successful ingestion is not reverted

- **Given** a validated batch of 10 non-duplicate monsters and a healthy database
- **When** the user confirms the import
- **Then** all 10 monsters are created
- **And** the response reports `reverted` false with the 10 inserted names

### Requirement: Import error reporting in the modal

The system SHALL display import validation and ingestion errors inside the modal in a region exposed as an ARIA alert with a stable, unambiguous test locator distinct from any page-level alert, and SHALL keep the modal open so the user can correct and retry.

#### Scenario: Validation error keeps the modal open and announced

- **Given** the user submits a file that fails validation
- **When** the error response is received
- **Then** the modal stays open showing the errors
- **And** the error region has `role="alert"` and a dedicated `data-testid` for the modal error
- **And** the user can select a different file without reloading the page

### Requirement: Monster JSON upload endpoint

The system SHALL provide monster JSON upload as a two-phase server operation — a validation phase that performs no writes and returns the import count and monster names (or structured errors), and an ingestion phase that accepts a whole-batch scope, enforces admin status for Global scope, applies duplicate skipping, performs a single bulk insert of survivors, and compensates by deleting inserted rows on failure.

#### Scenario: Validation phase performs no writes

- **Given** a valid monster document
- **When** it is sent to the validation phase
- **Then** the response contains the monster count and names
- **And** no monster records are created

#### Scenario: Ingestion phase never returns partial success

- **Given** a batch where some monsters would fail to persist
- **When** the ingestion phase runs and a write error occurs
- **Then** the response is a single failure result with `reverted` true
- **And** the response is never HTTP 207
- **And** no subset of the batch remains persisted

### Requirement: Performance

#### Scenario: Bounded database round trips for a large batch

- **Given** a validated import of several hundred non-duplicate monsters (within the 5 MB file cap)
- **When** the ingestion phase runs successfully
- **Then** it performs one duplicate-lookup query and one bulk insert operation
- **And** it does not issue a per-monster write

#### Scenario: Oversize file rejected without upload

- **Given** a selected file larger than 5 MB
- **When** the user submits it
- **Then** the client rejects it with a size error and sends no request
- **And** the server also rejects an over-cap body while streaming it, without buffering the full body first

### Requirement: Security

Global-scope access control is fully specified by the functional scenarios "Admin imports to the Global library" and "Forged Global request from a non-admin is denied" under *Import scope selection*.

#### Scenario: Ingestion errors do not leak infrastructure detail

- **Given** the bulk insert fails due to a database driver error
- **When** the failure response is returned to the client
- **Then** the client-facing error message describes the import failure and revert
- **And** it does not include database connection strings, credentials, or driver stack internals
- **And** full diagnostics are written to the server log

### Requirement: Reliability

#### Scenario: Compensating delete is idempotent and logs orphans

- **Given** an ingestion failure has triggered the compensating delete
- **When** one or more inserted ids cannot be deleted
- **Then** those ids are logged as orphaned monster ids on the server and returned to the client
- **And** re-running the compensating delete for the same ids does not error

#### Scenario: Process crash between insert and compensation is a documented non-guarantee

- **Given** the server process terminates after the bulk insert but before the compensating delete completes
- **When** the service restarts
- **Then** the affected monsters may remain in the target library (no automatic cleanup)
- **And** this limitation is stated in the modal's failure copy
