# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-18

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->

## Key Learnings

- **Project:** session-combat
- **Description:** holds a combat tracker and encounters for a single DnD session
- **Normalizer Architecture (issue #155):** Split normalizers into generic + provider-specific modules
  - Generic module (e.g., `lib/import/armor-class.ts`): Pure D&D 5e rules, zero external deps, reusable by all providers
  - Provider module (e.g., `lib/import/dndBeyond-armor-class.ts`): Maps provider-specific data structures to generic functions
  - Enables multi-provider support without duplicating D&D rules
  - Pattern applies to all normalizers in the #150-159 refactor series

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

**[2026-05-07] D&D 5e Heavy Armor Rule: Don't apply negative DEX modifiers**
- Heavy armor (max dex modifier = 0) should ignore ALL dex modifiers, not just cap at 0 via Math.min
- Math.min(dex, 0) incorrectly applies negative dex as penalty (e.g., dex -1 → -1)
- Correct approach: if maxDexterityModifier === 0, return 0 (not the dex value)
- Also applies to shields (armorTypeId 4): exclude from base armor selection, handle via modifiers instead
- These are D&D 5e rules bugs, not code bugs—fix them explicitly with tests covering edge cases

**[2026-05-22] Never use --admin to bypass branch protection on PR merges**
- Using `gh pr merge --admin` silently bypasses required checks (CI, coverage, security scans)
- If `mergeable_state: blocked`, investigate the blocking check and fix it — don't bypass it
- This allowed a PR with Codacy security findings and insufficient diff coverage to land on main

**[2026-05-23] jest.mock() factory TDZ — don't reference const variables inside jest.mock()**
- `jest.mock()` factories are hoisted above variable declarations; referencing a `const mockX = jest.fn()` inside the factory causes TDZ errors
- Fix: import the real module and use `jest.mocked()` on the import, then call `.mockResolvedValue()` in tests instead of inside the factory

**[2026-05-23] MongoDB ObjectId type mismatch with `User._id: string`**
- `User._id` is typed as `string?` in TypeScript, but MongoDB stores it as ObjectId
- Using `db.collection<User>('users').findOne({ _id: new ObjectId(...) })` causes TS error: ObjectId not assignable to Condition<string>
- Fix: use `db.collection('users')` (no generic) and bracket access `user['tokenVersion']` instead of dot notation

**[2026-05-23] tokenVersion DB check in requireAdmin — tests need matching tokenVersion in findOne mock**
- `requireAdmin` now checks tokenVersion before checking isAdmin
- Any test that mocks `findOne` for the admin check must include `tokenVersion: <n>` in the returned doc matching `ADMIN_AUTH.tokenVersion`
- Returning `{ isAdmin: true }` alone causes `undefined !== 0` → 401

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->

**2026-05-06: Generic + Provider-Specific Split for Normalizers (issue #155)**
- **Decision:** Extract normalizers into two separate modules: generic D&D rules + provider-specific mapping
- **Why:** Multi-provider support (#150-159 series) requires avoiding duplication of generic D&D 5e logic across provider adapters (DnD Beyond, Open5E, etc.)
- **Tradeoff:** Slightly more complex module structure vs. cleaner architecture that scales to N providers without duplication
- **Example:** `armor-class.ts` (generic: cap dex by armor type) + `dndBeyond-armor-class.ts` (provider: inventory to AC calculation)
