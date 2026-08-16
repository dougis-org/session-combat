## 1. Inventory scaffolding

- [ ] 1.1 Create `docs/storage-refactor/` directory
- [ ] 1.2 Enumerate every method on `storage` in `lib/storage.ts`, including
      the nested `storage.savedContent` sub-object, recording name, parent,
      and source line number for each
- [ ] 1.3 For each method, read its try/catch structure and classify
      `behavior` as one of `swallow`, `rethrow`, `mixed`, `no-try`, and
      record the `errorReturn` sentinel where applicable (`null`, `[]`,
      `false`, `undefined`, etc.)
- [ ] 1.4 For each method, grep its call sites across the 36 dependent files
      and record `{file, fn, line}` entries in `callers`
- [ ] 1.5 For each method, record any `existingTests` (search
      `tests/unit/lib/storage*.test.ts`, `tests/unit/storage/storage.test.ts`,
      and `tests/unit/lib/storage-shares.test.ts` for coverage) and leave
      `characterizationTest` as `null` unless task group 3 adds one
- [ ] 1.6 Write the complete result to `docs/storage-refactor/inventory.json`
      per the schema in `design.md`, including `schemaVersion`,
      `generatedFrom`, `generatedAt`, and `sourceLineCount`

## 2. Narrative doc

- [ ] 2.1 Write `docs/storage-refactor/plan.md`: purpose, the 4-value
      taxonomy definition, how to read `inventory.json`, and an explicit
      staleness warning that `#499` must re-verify (not blindly trust) the
      inventory before designing `runStorageOp` against it
- [ ] 2.2 Link `plan.md` and `inventory.json` from each other and reference
      #499 and #500

## 3. Characterization tests — loadSpellById (swallow)

- [ ] 3.1 Add a `describe("storage.loadSpellById")` block (new file or
      extend an existing `tests/unit/lib/storage*.test.ts` file, following
      the `jest.mock("@/lib/db")` + per-collection mock pattern already used
      in `tests/unit/lib/storage.characters.test.ts`)
- [ ] 3.2 Test: mock `findOne` to reject; assert `loadSpellById` resolves to
      `null` (not a rejection)
- [ ] 3.3 Test: mock `findOne` to resolve `null` (genuine not-found); assert
      `loadSpellById` also resolves to `null`
- [ ] 3.4 Add a comment on the pair of tests above stating explicitly that
      they pin the current DB-error/not-found ambiguity as a known
      characteristic, not a design goal, with a reference to #499
- [ ] 3.5 Update that method's `inventory.json` entry: set
      `characterizationTest` to the new test file path

## 4. Characterization tests — getMember (rethrow)

- [ ] 4.1 Add a `describe("storage.getMember")` block using the same mocking
      convention
- [ ] 4.2 Test: mock `findOne` to reject; assert `storage.getMember(...)`
      rejects with that same error (use `.rejects.toBe`/`.rejects.toThrow`
      as appropriate, not a swallowed resolution)
- [ ] 4.3 Update that method's `inventory.json` entry: set
      `characterizationTest` to the new test file path

## 5. Characterization tests — loadCharacters (mixed)

- [ ] 5.1 Add a `describe("storage.loadCharacters")` block; mock
      `db.collection` so `characters_active` and `characters` are
      independently controllable (mock keyed by collection name argument,
      not a single shared stub)
- [ ] 5.2 Test: `characters_active` query resolves normally; assert the
      returned data matches the view's mock data
- [ ] 5.3 Test: `characters_active` query rejects, `characters` fallback
      query resolves with data distinct from the view's mock; assert the
      returned data matches the *fallback's* mock specifically, proving the
      fallback path actually ran rather than the assertion passing
      vacuously
- [ ] 5.4 Test: both `characters_active` and `characters` queries reject;
      assert `loadCharacters` resolves to `[]` rather than rejecting
- [ ] 5.5 Update that method's `inventory.json` entry: set
      `characterizationTest` to the new test file path, and confirm `notes`
      describes the two-tier structure

## 6. Verification

- [ ] 6.1 Run the full test suite and confirm all new and existing tests
      pass against `lib/storage.ts` unmodified
- [ ] 6.2 Confirm `git diff` shows zero changes to `lib/storage.ts`
- [ ] 6.3 Spot-check at least 10 of the ~61 non-test-covered
      `inventory.json` entries against the actual source to catch
      misclassification before treating the inventory as reliable
- [ ] 6.4 Confirm `inventory.json` entry count matches the actual method
      count on `storage` (flat + `savedContent`) in `lib/storage.ts`
