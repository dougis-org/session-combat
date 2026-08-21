## Context

`lib/components/CampaignChat.tsx` currently implements the dice UI shipped by `dice-roll-enhancements` (archived 2026-08-20):

- `DiceTriggerButton` renders `<DiceD20Icon width={16} height={16} aria-hidden="true" />` with no `title`.
- `DicePoolPanel` renders each per-die button's icon as `<Icon width={14} height={14} aria-hidden="true" />` with no `title`, and the panel's root `<div>` takes `style={{ height: heightPx }}` where `heightPx={resolvedHeight}` — the same value used for the chat drawer's own height (`CampaignChat.tsx:912`). The panel's content (six die controls, a modifier input, a visibility select, and a Roll button) is a fixed, small height, so whenever `resolvedHeight` exceeds that content height — which is most of the time, since `resolvedHeight` follows the user's drag-resized or default drawer height — the panel shows dead space below its controls.
- A single `pendingScrollRef` (a `useRef(false)`) gates a `useEffect` keyed on `[feed]` that calls `container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })` when the ref is `true`, then resets it. The ref is set to `true` in exactly one place: `handleRollPosted`, which is called from the dice pool's commit-success path (the local POST response). It is never set from `onStreamEvent`'s `'roll'` branch, which is what appends rolls broadcast over SSE — including the broadcast of the local user's own roll, echoed back to their own connection.

That last point creates the reported bug, not just a scoping gap: `handleRollPosted` and the SSE `'roll'` handler both guard against duplicate ids via the same `seenIds` ref. Whichever one runs *first* for a given roll id wins; the other returns early. If the SSE echo of the user's own roll arrives at (or before) the same tick as the POST-response callback, the SSE path adds the roll to `feed` (without touching `pendingScrollRef`), and `handleRollPosted` then finds `seenIds.current.has(roll.id)` true and returns before ever setting `pendingScrollRef`. No scroll happens — for anyone, including the roller. This is a race, not a deterministic failure, which is consistent with the issue reporter describing it as happening but not investigating further.

## Goals / Non-Goals

**Goals:**
- Increase the two existing icon call-sites' `width`/`height` by 50% (16→24, 14→21). No change to the icon components themselves (`lib/components/icons/dice.tsx`).
- Add native `title` attributes to the trigger button and each per-die pool button. No new tooltip component, no new dependency.
- Make the dice panel's height content-driven, not drawer-height-driven, eliminating dead space regardless of the drawer's current (possibly drag-resized) height.
- Make dice-roll auto-scroll independent of *which code path* appended the roll to the feed — SSE stream event or local POST-response callback both trigger it, exactly once per roll, with no dependency on which one wins a race. (Refined during PR review to also guard remote rolls behind bottom-proximity — see D4's "Updated during review" note.)
- Keep the fix scoped to dice rolls. Plain chat messages' scroll behavior is unchanged (they still never auto-scroll) — this is an explicit, deliberate scope boundary from the proposal, not an oversight.

**Non-Goals:**
- No change to `lib/utils/dice.ts`, the roll data model, or the `/api/campaigns/[id]/rolls` API contract.
- No general "scroll to bottom for any new feed item" behavior — that would need a near-bottom heuristic to avoid yanking a user reading scrollback, which is out of scope for this fast-follow.
- No generalized tooltip system for the rest of the app.
- No re-litigating the flex-sibling panel-placement decision (`roll-share-ui`'s "renders as an in-flow flex sibling to the left of the chat dock") — only its height-matching sub-requirement changes.

## Decisions

### D1: Icon size — bump the two call-site props, not the icon components

The vendored icon components (`DiceD4Icon` … `DiceD20Icon`) already accept `width`/`height`/`className` as pass-through props (per `dice-iconography`'s "Icon components are stylable like existing hand-rolled icons" requirement); no default size is baked into the components themselves. So a 50% increase is purely a call-site change: `16→24` at `DiceTriggerButton` (`CampaignChat.tsx:391`) and `14→21` at `DicePoolPanel`'s per-die button (`CampaignChat.tsx:434`).

**Alternatives considered:** Adding a `size` prop or default to the icon components — rejected; the components are already appropriately sized-by-caller per the existing `dice-iconography` spec, and both current call sites are the only two places dice icons render, so a shared default would be one indirection with no reuse benefit.

### D2: Tooltips via native `title`, not a tooltip component

Use the browser-native `title` attribute on the trigger button (`"Dice Rolls for main screen pop out"`) and on each per-die pool button (`"d4"`, `"d6"`, …, `"d20"`, matching that button's `aria-label`/die size). This is consistent with `dice-roll-enhancements`' D1 decision to avoid adding any dependency for the (small, static) dice UI, and the project currently has zero tooltip primitives anywhere in the codebase — introducing one for six buttons would be disproportionate.

**Alternatives considered:**
- A custom `<Tooltip>` component (e.g., positioned `<div>` shown on hover/focus): rejected — adds new UI surface, new CSS, and new test surface (hover/focus-trigger timing) for a problem the native attribute already solves; would only be justified if the app needed richer tooltip content (e.g., formatted text, links) elsewhere, which it doesn't today.
- A UI library tooltip primitive (e.g., Radix): rejected — new dependency, same reasoning as `dice-roll-enhancements` D1's rejection of an icon package for six static SVGs.

### D3: Dice panel height — drop `heightPx`, let the panel size to content

Remove the `heightPx` prop from `DicePoolPanel` (and the `style={{ height: heightPx }}` it drives) entirely; the panel's outer `<div>` keeps its existing `w-64 flex-shrink-0 overflow-y-auto` classes but no longer receives an explicit `height`, so it sizes to its content's natural height (six die-control rows + modifier/visibility row + Roll button + any error text). This reverses `roll-share-ui`'s "the panel SHALL match the drawer's current height" sub-requirement, which was `dice-roll-enhancements`' D3 — that decision aimed to keep the panel and drawer as "one visually contiguous block," but in practice produces exactly the dead-space complaint in issue #514. The panel remains a flex sibling positioned to the left of the drawer (that placement is unchanged); only its height source changes.

**Alternatives considered:**
- Keep height-matching but vertically center the panel's content within it: rejected — still wastes screen space and adds unnecessary layout complexity (flex-centering inside a fixed-height sibling) for no benefit once the "contiguous block" framing is dropped.
- Cap `heightPx` at some smaller fixed value (e.g., `min(resolvedHeight, 300)`): rejected — reintroduces an arbitrary magic number and still couples the panel's height to the drawer's, when the actual requirement is "no dead space," which content-driven sizing satisfies directly and simply.
- Keep `overflow-y-auto` even though it's no longer load-bearing for clipping (content is short and no longer height-constrained): kept anyway as a defensive floor — if a future die size or control is added and the panel's natural content height somehow exceeds the viewport, scrolling is a safe fallback rather than an unbounded/clipped panel.

### D4: Auto-scroll — a single `scrollToBottom()` call reachable from both append paths, no ref-based race

Replace the `pendingScrollRef`-gated effect with a direct call at the point each dice roll is appended to `feed`: both `handleRollPosted` (local POST-response callback) and the `'roll'` branch of `onStreamEvent` (SSE) call the same `scrollToBottom()` helper immediately after their `setFeed` call, wrapped in `requestAnimationFrame` so it runs after the DOM reflects the new item (mirroring the existing `requestAnimationFrame(() => { container.scrollTop = ... })` pattern already used by the infinite-scroll-up handler at `CampaignChat.tsx:713`). Because `seenIds` already deduplicates a given roll id to exactly one of the two append paths, `scrollToBottom()` fires exactly once per roll regardless of which path wins the race — eliminating the race itself rather than trying to make the ref win more reliably.

**Alternatives considered:**
- Fix the race by setting `pendingScrollRef.current = true` in both places before the dedup check: rejected — still indirect (state flag + separate effect) for no benefit over calling the scroll function directly at the append site; the ref-plus-effect indirection was only ever needed if scrolling depended on `feed` having already re-rendered, but `requestAnimationFrame` after `setFeed` already gets that for free, same as the existing infinite-scroll-up code does.
- Debounce/coalesce scroll calls for rapid successive rolls (e.g., a dice-pool commit posting many rolls quickly): not needed — each commit posts exactly one combined roll (`roll-share-ui`'s "Commit rolls the entire staged pool as one combined roll"), so multiple rapid roll events are not expected in normal use; `scrollTo` is idempotent (scrolling to the same bottom position repeatedly is a no-op) if it ever does happen.

**Updated during PR review (`pr-review-toolkit:review-pr` on PR #519):** the original decision above rejected a near-bottom guard, reasoning dice rolls were rare/high-signal enough to justify always yanking the view to the bottom. Review disagreed: unconditionally scrolling on *every remote player's* roll — not just the current user's own — still yanks a user who has deliberately scrolled up to read history (or is at `scrollTop 0` to trigger the older-page load), and this can happen at any frequency the table rolls at, not just on the current user's own action. The fix actually shipped in PR #519 (commits `cb7df30`, `1edd886`, `f5c5583`) is narrower than a blanket "unconditional" and narrower than the fully-generalized near-bottom guard this design originally deferred:
  - `scrollToBottom(force: boolean)` takes a `force` flag. `handleRollPosted` (the roller's own committed roll) and the SSE echo of the *current user's own* roll (`roll.rollerId === user?.userId`) call it with `force: true` — the roller is always scrolled to their own roll, matching the original goal exactly.
  - Every other SSE `'roll'` event (a genuinely remote player's roll) calls it with `force: false`, which only scrolls if the container was already within 100px of the bottom (measured *before* the pending feed update commits, to avoid the newly-appended card's own height making every remote roll look "far away").
  - This is deliberately still scoped to dice rolls only (chat messages remain untouched, matching the original non-goal) — it narrows *when* a remote roll auto-scrolls, it does not generalize scrolling to other feed item types.

This narrows the shipped behavior relative to the "Goals" section above and to `roll-share-ui`'s originally-drafted "MODIFIED Feed auto-scrolls on a new dice roll, for any user" requirement text (which said auto-scroll "SHALL fire" unconditionally for every roll). The spec has been corrected post-hoc to describe the guard; see the updated scenario in `openspec/specs/roll-share-ui/spec.md`.

## Risks / Trade-offs

- [Risk] Removing the height-match could make the panel and drawer look visually disconnected (the "contiguous block" framing `dice-roll-enhancements` D3 wanted is gone) → Mitigation: both remain flex siblings with matching top alignment and consistent `bg-gray-800 border border-gray-700` styling; visual contiguity was never load-bearing for functionality, only aesthetics, and the issue reporter explicitly asked for exactly this trade-off (less dead space over matched height).
- [Risk] Unconditional auto-scroll on every dice roll could yank a user who deliberately scrolled up to read roll history while a roll comes in from another player → **Resolved during PR review, not merely mitigated**: rather than shipping the accepted-risk version, a bottom-proximity guard was added for remote rolls (see D4 "Updated during PR review"). The roller's own roll still always scrolls them to it.
- [Risk] `title` tooltips are less discoverable/stylable than a rich tooltip (no delay tuning, inconsistent OS-level rendering, not usable on touch without a long-press) → Mitigation: acceptable for a first pass matching the issue's literal ask; `aria-label`s (already present) continue to carry the accessible name, so `title` is purely a supplementary hover affordance, not the sole source of the button's meaning.

## Migration Plan

No data migration. This is a UI-only change to a single client component and its existing icon module call sites. Deploy as a normal PR merge; no feature flag, no phased rollout — the prior behavior (small icons, no tooltips, height-matched panel, self-roll-only/racy auto-scroll) has no dependents outside `CampaignChat.tsx` itself. Rollback is a plain revert if needed.

## Operational Blocking Policy

- **CI failure** (unit tests, typecheck, build): blocking — must be fixed before merge. No override.
- **Failing/flaky auto-scroll or panel-height test**: blocking — these encode the exact race condition and dead-space bugs this change exists to fix; do not skip or `.skip()` them.
- **Code review findings from `pr-review-toolkit:review-pr` or the Verity quality gate**: blocking for anything within this change's declared scope (icon size, tooltips, panel height, auto-scroll). Findings against pre-existing code outside that scope (e.g. the unbounded modifier input, overall file size) are non-blocking for *this* PR — they must be triaged as either an explicit scope amendment to this proposal (with proposal/design updated first, per the change-control note) or filed as a separate follow-up change, but they do not gate this merge. The unbounded-modifier-input finding was triaged this way: filed as [issue #516](https://github.com/dougis-org/session-combat/issues/516), left unfixed here.
- **Manual smoke-test failure** (task 5.2-equivalent in `tasks.md`): blocking if a regression is observed in the browser that the automated suite didn't catch; non-blocking (may proceed with a tracked follow-up) if the browser check simply couldn't be run due to environment limitations, provided automated coverage of the same behavior is green.
