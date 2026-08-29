## ADDED Requirements

### Requirement: Centralized percentile roll helper

The system SHALL expose a `rollPercentile()` operation in the centralized dice utility that rolls two d10 dice using the same rejection-sampled secure random generation as `rollDie`, and returns `{ tensFace, onesFace, value }` where:

- `tensFace` and `onesFace` are each integers in 1..10 (two independent `rollDie(10)`-equivalent draws)
- `value = (tensFace % 10) * 10 + (onesFace % 10)`, and when that expression is `0`, `value` is `100`
- `value` is therefore always an integer in 1..100

The helper SHALL make two independent single-die draws rather than one `rollDie(100)` draw, so callers (including future roll-animation code) can present two physical d10 results.

#### Scenario: Return shape and ranges

- **WHEN** `rollPercentile()` is called
- **THEN** it returns an object with `tensFace` in 1..10, `onesFace` in 1..10, and `value` in 1..100

#### Scenario: Special-case decode to 100

- **WHEN** the underlying draws are `tensFace = 10` and `onesFace = 10`
- **THEN** `value` is `100`

#### Scenario: "00" tens with non-zero ones decodes to a single digit

- **WHEN** the underlying draws are `tensFace = 10` and `onesFace = 9`
- **THEN** `value` is `9`

#### Scenario: Standard decode

- **WHEN** the underlying draws are `tensFace = 9` and `onesFace = 7`
- **THEN** `value` is `97`

#### Scenario: Each d10 draw is unbiased

- **WHEN** `rollPercentile()` is called repeatedly
- **THEN** each face 1..10 is produced for both `tensFace` and `onesFace` with equal probability within the limits of the secure generator, using the same rejection-sampling approach `rollDie` uses
