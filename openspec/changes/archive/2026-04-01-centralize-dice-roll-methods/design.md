## Context

The codebase currently exposes a single dice helper in `lib/utils/dice.ts`:
`rollD20()`. It uses secure randomness and rejection sampling, and the combat
screen imports it directly for initiative rolls. Issue #13 asks for a single
central dice API that handles standard RPG die sizes and multi-die rolls from a
shared back-end entry point.

This change is not about game rules; it is about consolidating random dice
generation into one authoritative implementation so future callers do not each
invent their own dice logic.

### Proposal-to-design mapping

- Central dice API -> one server-side `rollDie(sides, count = 1)` operation.
- Multi-die support -> return an array of individual roll values only.
- Remove convenience wrapper -> retire `rollD20` and update callers.
- Keep randomness unbiased -> preserve rejection sampling and secure crypto.

## Goals / Non-Goals

**Goals:**

- Provide one backend dice operation for d4, d6, d8, d10, d12, d20, and d100.
- Support `count` with a default of `1`.
- Return an array for every request, including single-die rolls.
- Keep the implementation secure and unbiased.
- Remove the `rollD20` convenience path so there is one source of truth.

**Non-Goals:**

- Parsing dice expressions such as `2d6+3`.
- Summing results on the server.
- Advanced dice mechanics such as advantage, rerolls, or exploding dice.
- Persisting roll history.

## Decisions

1. **Use a single server-side `rollDie(sides, count = 1)` contract.**
   This keeps the surface area small and gives future callers one place to go.
   Separate named methods for each die size would duplicate logic without adding
   behavior.

2. **Return an array for all calls, even when `count = 1`.**
   This satisfies the current requirement and avoids a dual return type that
   would complicate callers and tests. A single-die request should still be
   represented as a one-element array.

3. **Preserve rejection sampling with secure crypto.**
   The current helper already does this correctly. Reusing the same pattern keeps
   all supported die sizes unbiased.

4. **Remove `rollD20` rather than keeping it as a compatibility alias.**
   Keeping it would preserve convenience, but it would also extend duplicate API
   surface and encourage new callers to bypass the shared contract. Refactoring
   current consumers to the unified API is the cleaner long-term choice.

5. **Treat client usage as a thin consumer of the backend operation.**
   Because current combat code imports `rollD20` directly, the refactor needs a
   small caller update. The design favors one backend source of truth over a
   client-side duplicate implementation.

## Risks / Trade-offs

- [Client refactor churn] The combat screen currently expects a synchronous
  helper. Moving to a backend operation may require a small async boundary.
  → Mitigation: isolate the request in a tiny wrapper and keep the API payload
  minimal.
- [Response shape changes] Returning arrays everywhere will change any code that
  assumed a scalar d20 result.
  → Mitigation: update the small set of current consumers together with tests.
- [Validation errors] Unsupported die sizes or invalid counts need predictable
  failures.
  → Mitigation: validate inputs centrally and reject bad requests with clear
  errors.

## Rollback / Mitigation

If CI or review blocks the change, keep the backend operation and caller updates
behind the existing tests until the failure is resolved. If the new API proves
too disruptive, the safest rollback is to restore the previous `rollD20` wrapper
temporarily while preserving the new implementation underneath it, then remove
the wrapper again after the blocking issue is fixed.

Operational blocking policy: do not merge while tests, lint, type-check, or
review comments remain unresolved. If a blocking issue appears, stop at the
smallest safe surface and correct the shared dice implementation before touching
additional consumers.

## Open Questions

None. The requested API shape is settled: one backend `rollDie(sides, count = 1)`
operation, array-only results, and no `rollD20` convenience wrapper.
