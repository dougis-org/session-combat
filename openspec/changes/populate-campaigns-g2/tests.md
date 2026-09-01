# Tests

This change reuses the existing per-campaign contract test pattern in
`tests/unit/lib/scripts/seedCampaignTemplates.test.ts`. Each G2 campaign
already has its own `describe(...)` block covering:

- Chapter count matches the published campaign structure.
- Every encounter in the catalog entry has a non-empty `monsters` array.
- Every `Monster` in every encounter has `id`, `name`, `challengeRating`,
  `abilityScores`, and `hp > 0`.
- Every monster `id` across all encounters is unique (verifies the
  `toEncounterMonster(s)` invariant).

## Existing per-campaign contract tests

The following test blocks already exist in
`tests/unit/lib/scripts/seedCampaignTemplates.test.ts`:

| Campaign | Describe block | Line |
| --- | --- | --- |
| Waterdeep: Dragon Heist | `describe("Waterdeep: Dragon Heist encounters", ...)` | ~279 |
| Storm King's Thunder | `describe("Storm King's Thunder encounters", ...)` | ~296 |
| Out of the Abyss | `describe("Out of the Abyss encounters", ...)` | ~313 |
| Dragon of Icespire Peak | `describe("Dragon of Icespire Peak encounters", ...)` | ~330 |
| Phandelver and Below: The Shattered Obelisk | `describe("Phandelver and Below: The Shattered Obelisk encounters", ...)` | ~347 |

All five use the shared helper `assertCampaignEncounterContract(seeded, name, expectedChapterCount)`
which consolidates the assertions above.

## Acceptance tests (mapped to spec scenarios)

| Spec scenario | Test |
| --- | --- |
| WDH encounters populated | `it("WDH has 9 chapters and encounters with full Monster stat blocks", ...)` |
| SKT encounters populated | `it("SKT has 10 chapters and encounters with full Monster stat blocks", ...)` |
| OotA encounters populated | `it("OotA has 17 chapters and encounters with full Monster stat blocks", ...)` |
| DIP encounters populated | `it("DIP has 4 chapters and encounters with full Monster stat blocks", ...)` |
| PaBtSO encounters populated | `it("PaBtSO has 8 chapters and encounters with full Monster stat blocks", ...)` |
| No descriptive damage type strings | TypeScript compile + eslint on `lib/data/customMonsters.ts` |
| Passive perception is a string | TypeScript typecheck on `lib/data/customMonsters.ts` |

## Pre-existing shared tests that cover this change

| Test | What it verifies |
| --- | --- |
| `it("inserts missing templates and skips existing ones", ...)` | The `seedCampaignTemplates` default behavior is unchanged |
| `it("force-updates existing templates when force=true", ...)` | The `--force` upsert path still works with the G2 catalog entries |
| `it("returns zero updated when no templates exist and force=true", ...)` | The `--force` flag doesn't misbehave on an empty DB |

## BDD/TDD note

The G2 work followed the TDD pattern from G1: write a `describe` block
asserting chapter count + non-empty encounter arrays, watch it fail (because
the catalog had placeholder encounters), then implement the per-campaign
helper, then watch it pass. The committed code reflects this — the test file
in `tests/unit/lib/scripts/seedCampaignTemplates.test.ts` lines 279-362 is
the failing-then-passing test artifact.
