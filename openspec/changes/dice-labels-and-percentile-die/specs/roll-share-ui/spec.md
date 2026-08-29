## MODIFIED Requirements

### Requirement: MODIFIED Dice staging pool

The system SHALL let the user add and remove dice of any supported size (d4, d6, d8, d10, d12, d20) to a staging pool within the dice panel, and edit a shared modifier, without issuing any roll or network request until the user explicitly commits. Each die-size control SHALL display that die size's vendored icon (see `dice-iconography` capability) at 21x21px alongside its staged count **and a persistent, visible `d{sides}` text label**. The previously-required per-control `title` tooltip is no longer required (the visible label supersedes it) and SHALL be removed.

#### Scenario: Adding a die increments its staged count

- **Given** the panel is open and the pool is empty
- **When** the user adds a d6 twice and a d8 twice
- **Then** the pool shows a staged count of 2 for d6 and 2 for d8, and 0 for all other sizes
- **AND** no network request has been made

#### Scenario: Removing a die decrements its staged count

- **Given** the pool has a staged count of 2 for d6
- **When** the user removes one d6
- **Then** the pool shows a staged count of 1 for d6

#### Scenario: Staged count cannot go below zero

- **Given** the pool has a staged count of 0 for d10
- **When** the user attempts to remove a d10
- **Then** the staged count for d10 remains 0 and no error is raised

#### Scenario: Modifier is editable independent of staged dice

- **Given** the pool is empty
- **When** the user sets the modifier to -2
- **Then** the modifier value is -2 and no die counts change

#### Scenario: Each die-size control shows its matching icon at the increased size

- **Given** the panel is open
- **When** the six die-size add/remove controls are inspected
- **Then** each control renders the icon from `DIE_ICONS` matching its own die size at 21x21px (e.g. the d20 control renders the d20 icon, not a d6 icon or plain text)

#### Scenario: Each die-size control shows a persistent visible label

- **Given** the panel is open
- **When** the d20 add control is inspected
- **Then** the visible text `d20` is rendered within the control (not only in a `title` or `aria-label`), and analogously for d4, d6, d8, d10, d12

#### Scenario: Die-size controls carry no title tooltip

- **Given** the panel is open
- **When** any die-size add control is inspected
- **Then** it has no `title` attribute

## ADDED Requirements

### Requirement: ADDED Standalone percentile (d%) roll control

The dice panel SHALL provide a standalone percentile control, rendered inline in the same row as the pool die controls (as the last item), that on activation performs a single percentile roll. The control is not a poolable die: it has no staged count, no remove affordance, is not combined with staged dice, and does not apply the shared modifier. It SHALL render two `DiceD10Icon`s and the visible label `d%` (see `dice-iconography` capability).

A percentile roll SHALL be produced by two independent `rollDie(10)` results (`tensFace`, `onesFace`) decoded as:

- `tensDigit = tensFace % 10`, `onesDigit = onesFace % 10`
- `value = tensDigit * 10 + onesDigit`; when `value` is `0`, `value` is `100`

It SHALL be committed through `/api/campaigns/[id]/rolls` with the existing contract unchanged: `formula: "d%"`, `rolls: [value]` (a single integer, 1..100 — the decoded value), `total: value`, and `visibility` matching the panel's current selection.

#### Scenario: Percentile control renders with the d% glyph and no count

- **Given** the dice panel is open
- **When** the percentile control is inspected
- **Then** it renders two d10 icons and the visible label `d%`, has no staged-count badge, and has no remove control

#### Scenario: Activating the percentile control commits one roll

- **Given** the dice panel is open and a campaign session is active
- **When** the user activates the percentile control
- **Then** exactly one POST to `/api/campaigns/[id]/rolls` is made with `formula: "d%"`, `rolls` containing exactly one integer in 1..100, `total` equal to that integer, and `visibility` matching the panel's current selection
- **AND** the staged pool and modifier are unchanged

#### Scenario: Percentile decode covers the tabletop special case

- **Given** the two d10 results are `tensFace = 10` and `onesFace = 10`
- **When** the percentile value is decoded
- **Then** the value is `100`

#### Scenario: Percentile decode of a "00" tens with a non-zero ones

- **Given** the two d10 results are `tensFace = 10` and `onesFace = 9`
- **When** the percentile value is decoded
- **Then** the value is `9`

#### Scenario: Percentile control is unavailable without an active session

- **Given** the chat-dock dice panel and `activeSessionId` is null
- **When** the panel state is inspected
- **Then** the percentile control is disabled on the same terms as the pool "Roll" commit control

### Requirement: ADDED Roll feed renders a percentile roll through the existing formula path

The system SHALL render a persisted percentile `CampaignRoll` (`formula: "d%"`, single-element `rolls`) using the same roll-feed-item treatment as any other roll — roller name, timestamp, visibility marker, formula, breakdown, total — with no percentile-specific layout.

#### Scenario: Percentile roll feed item

- **Given** a `CampaignRoll` with `formula: "d%"`, `rolls: [97]`, `total: 97`
- **When** the roll is rendered in the feed
- **Then** the item displays `d%`, the breakdown `[97]`, and `97`, with the standard roll-item visual treatment

#### Scenario: Percentile roll feed item for the 100 result

- **Given** a `CampaignRoll` with `formula: "d%"`, `rolls: [100]`, `total: 100`
- **When** the roll is rendered in the feed
- **Then** the item displays `d%`, the breakdown `[100]`, and `100`
