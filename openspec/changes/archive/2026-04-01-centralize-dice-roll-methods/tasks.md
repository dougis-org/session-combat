## 1. Preparation

- [x] 1.1 Confirm the current dice call sites and test coverage for `lib/utils/dice.ts` and any consumers
- [x] 1.2 Check out `main`, pull with fast-forward only, and create/push the feature branch before implementation
- [x] 1.3 Confirm the final API contract for `rollDie(sides, count = 1)` is reflected in the planned tests

## 2. Execution

- [x] 2.1 Implement the centralized backend dice operation with supported sides `4, 6, 8, 10, 12, 20, 100`
- [x] 2.2 Make the backend return an array for every successful roll, including single-die requests
- [x] 2.3 Validate `sides` and `count` centrally and reject unsupported or invalid values
- [x] 2.4 Remove or refactor `rollD20` so callers use the centralized dice operation directly
- [x] 2.5 Update current consumers, including combat initiative logic, to use the shared dice API
- [x] 2.6 Add or update any API route or client wrapper needed to preserve the back-end-only source of truth

## 3. Validation

- [x] 3.1 Add unit tests for supported die sizes and the default `count = 1` behavior
- [x] 3.2 Add unit tests for multi-die rolls returning the correct number of array entries
- [x] 3.3 Add unit tests for invalid die sizes and invalid counts
- [x] 3.4 Keep the crypto / rejection-sampling failure path covered
- [x] 3.5 Run the focused dice test suite
- [x] 3.6 Run the full lint and type-check commands

## 4. PR and Merge

- [x] 4.1 Commit the implementation and tests on the feature branch
- [x] 4.2 Push the branch and open a PR targeting `main`
- [x] 4.3 Resolve CI failures before merge; do not merge with red checks
- [x] 4.4 Address all blocking review comments, then push fixes and re-run validation
- [x] 4.5 Enable auto-merge only after CI is green and review is clear

## 5. Post-Merge

- [x] 5.1 Checkout `main` and pull the merged changes with fast-forward only
- [x] 5.2 Sync the approved spec delta back to `openspec/specs/dice-rolling/spec.md` before archive if required by the workflow
- [ ] 5.3 Archive the change as a single atomic commit that includes both the archive copy and removal of the change directory
- [ ] 5.4 Push the archive commit to `main`
- [ ] 5.5 Prune the merged local feature branch after archive
- [ ] 5.6 Update any related docs if implementation details changed during delivery
