## MODIFIED Requirements

### Requirement: MODIFIED Standalone dice pool modal with no session dependency

The system SHALL let an authenticated user open a modal anchored to the bottom-left corner over the trigger button from the fab that provides a dice pool builder (add/remove d4/d6/d8/d10/d12/d20, edit a shared modifier) and roll it using `rollDicePool()`, entirely independent of any campaign or session context, with no network request required to see a result. Each die control SHALL be rendered via the shared `DiePoolButton` component (see `dice-iconography` capability), showing the die's icon, staged count, and a **persistent visible `d{sides}` label**. The modal SHALL also present a standalone percentile control (shared `PercentileButton`, `d%` glyph) that produces a single percentile result via `buildPercentileRoll()` (see `dice-pool-shared-state` capability), separate from the staged pool.

#### Scenario: Opening the fab shows a modal anchored to the bottom-left

- **Given** the fab is visible and the modal is closed
- **When** the user clicks the fab
- **Then** a modal appears with its bottom-left corner overlaying the trigger button containing die add/remove controls for all six supported sizes and a modifier input
- **And** the background dimming overlay is displayed

#### Scenario: Each die control shows a persistent visible label

- **Given** the modal is open
- **When** the six die controls are inspected
- **Then** each renders the visible text `d{sides}` matching its own die size (as rendered content, not only a tooltip)

#### Scenario: Rolling with no active-session presence produces a local result and no network call

- **Given** the modal is open, no `CampaignChat` presence has been announced, and the pool has at least one die staged
- **When** the user rolls
- **Then** the modal displays the individual die results and total computed by `rollDicePool()`, and no HTTP request is made

#### Scenario: Empty pool cannot be rolled

- **Given** the modal is open and every die size has a staged count of 0
- **When** the user looks at the roll control
- **Then** the pool roll control is disabled (the standalone percentile control is unaffected by the staged-pool count)

#### Scenario: Percentile control produces a local d% result

- **Given** the modal is open and no presence has been announced
- **When** the user activates the percentile control
- **Then** the modal displays a result with `formula` `d%` and a total in 1..100 computed by `buildPercentileRoll()`, and no HTTP request is made

#### Scenario: A local percentile result is sendable to session chat on the same terms as a pool roll

- **Given** dice-session presence exists and the user has just produced a percentile result
- **When** the user clicks "send to session chat"
- **Then** the fab calls the shared `submitRoll` with `formula: "d%"`, `rolls: [value]`, `total: value`, and the current visibility, and `sendState` transitions per the shared submission result

## REMOVED Requirements

### Requirement: REMOVED Instant tooltips for dice buttons

**Reason**: Superseded by the persistent visible `d{sides}` label now rendered under every die control (see `roll-share-ui` "MODIFIED Dice staging pool" and `dice-iconography` "Shared die glyph component pairs each icon with a visible label"). With the die name always on screen, the per-button hover tooltip — and the custom `hoveredTooltip` state and hover-popover element that implemented it to avoid the native `title` delay — no longer serve a purpose and are removed.

**Migration**: Tests asserting a hover-triggered tooltip element appears over a die button in the global dice fab must be updated to assert the persistent visible label instead. The fab's *trigger* button tooltip ("Roll dice") is unchanged.
