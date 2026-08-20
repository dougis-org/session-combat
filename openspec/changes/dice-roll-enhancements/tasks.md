## 1. Vendor dice icon set (`dice-iconography`)

- [x] 1.1 Write failing tests for `lib/components/icons/dice.tsx`: an icon component exists per die size (4/6/8/10/12/20), `DIE_ICONS` lookup resolves the correct component per size and covers exactly those six keys, each component renders valid `<svg>` markup, and each accepts/forwards `width`/`height`/`className`.
- [x] 1.2 Download the d4/d6/d8/d10/d12/d20 SVGs from game-icons.net (Delapouite, CC BY 3.0 — e.g. `dice-twenty-faces-twenty` for d20) and extract their path data.
- [x] 1.3 Implement `lib/components/icons/dice.tsx`: one component per die size using the extracted path data, `currentColor` fill, `width`/`height`/`className` props matching the existing inline-SVG icon pattern in `CampaignChat.tsx`, plus the `DIE_ICONS` lookup map.
- [x] 1.4 Add the CC BY 3.0 attribution (header comment in `dice.tsx` crediting game-icons.net/Delapouite, per design decision D2/open question) and a test asserting the attribution text is present in the module source.
- [x] 1.5 Confirm all tests from 1.1 and 1.4 pass.

## 2. Swap text/emoji glyphs for vendored icons (`roll-share-ui` MODIFIED requirements)

- [x] 2.1 Write a failing test that `DicePoolTrigger` renders the vendored d20 icon component and does not render the literal text `d20`, while its accessible name (`/roll|dice/i`) is unchanged.
- [x] 2.2 Update `DicePoolTrigger` in `lib/components/CampaignChat.tsx` to render `<DIE_ICONS[20] />` (or the named d20 icon) instead of the `d20` text node; confirm the test from 2.1 passes.
- [x] 2.3 Write a failing test that each of the six die-size add/remove controls in the dice pool renders the icon matching its own `sides` value (from `DIE_ICONS`) instead of a `d{sides}` text label, alongside its existing count.
- [x] 2.4 Update the per-die button markup to render `DIE_ICONS[sides]` plus the `×{pool[sides]}` count instead of the current `d{sides} ×{pool[sides]}` text; confirm the test from 2.3 passes.
- [x] 2.5 Write a failing test that `RollFeedItem` renders the vendored d20 icon and does not render the 🎲 emoji character.
- [x] 2.6 Update `RollFeedItem` in `lib/components/CampaignChat.tsx` to render the d20 icon in place of `🎲`; confirm the test from 2.5 passes.

## 3. Replace the floating portal with a flex-sibling dice panel

- [x] 3.1 Write failing tests for the new placement: the dice panel's root element is a DOM sibling of the `role="complementary"` drawer (both children of one flex-row wrapper) — not a descendant of a `document.body`-attached `#dice-pool-overlay-root` node; the panel's bounding position is entirely left of the drawer's; the panel matches the drawer's current height; the panel is absent from the DOM (and no overlay-root node exists) when closed.
- [x] 3.2 Remove `DicePoolPortal`, `getDiceOverlayRoot`, `DICE_OVERLAY_ROOT_ID`, and the `createPortal`/`react-dom` import from `lib/components/CampaignChat.tsx`.
- [x] 3.3 Restructure `CampaignChat`'s expanded-state return value into a flex row containing the dice panel (rendered conditionally on `DicePoolTrigger`'s `isOpen` state, lifted or passed down as needed) to the left of the existing drawer `<div>`, matching the `resolvedHeight` used by the drawer. Preserve the trigger button's existing position at the bottom of the drawer.
- [x] 3.4 Carry over the existing outside-click and Escape-to-close behavior (previously wired against `popoutRef`/`triggerRef` in `DicePoolPortal`'s consumer) onto the new sibling panel's ref, so the two scenarios below keep passing unmodified: "Dice panel closes on outside click" and "Dice panel closes on Escape".
- [x] 3.5 Update the existing `multi-dice-pool-popout`-era tests in `tests/unit/components/CampaignChat/` that assert portal-to-`document.body` / non-descendant-of-drawer / `fixed`-position-from-`getBoundingClientRect()` behavior, per the `roll-share-ui` spec's REMOVED "Floating dice pop-out renders outside the chat dock's DOM subtree" requirement — replace with assertions matching the new sibling-placement scenarios from 3.1.
- [x] 3.6 Confirm all tests from 3.1 and the updated tests from 3.5 pass.

## 4. Auto-scroll the feed to the user's own newly-posted roll

- [x] 4.1 Write a failing test: given the feed is scrolled away from the bottom and a dice-pool commit succeeds (201 response), the feed container's scroll position moves to reveal the new roll item after it is appended.
- [x] 4.2 Write a failing test: given the feed is scrolled away from the bottom, an SSE `roll` event for another user's roll is appended, and the feed's scroll position does NOT change.
- [x] 4.3 Write a failing test: the feed's item order is unchanged after the current user's roll is appended and auto-scrolled (no reordering — the new roll remains the last item).
- [x] 4.4 Implement the scroll trigger per design decision D4: add a `pendingScrollRef` set by `handleRollPosted` (the callback passed to `DicePoolTrigger`/invoked after a successful own-roll commit), and a `useEffect` keyed on `feed` that checks/clears the ref and calls `feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })` when set. Do not set the flag in the SSE `roll` branch of `onStreamEvent`.
- [x] 4.5 Confirm all tests from 4.1–4.3 pass.

## 5. Documentation and deferred-work note

- [x] 5.1 Add a short code comment or `openspec/changes/dice-roll-enhancements/design.md`-referenced note near the dice icon module (or in a project-level follow-up note, per team convention) recording `@3d-dice/dice-box` as deferred future work for real animated 3D rolls, so it isn't silently forgotten.

## 6. Verification and PR

- [x] 6.1 Run the full unit test suite (`npm run test:unit` or equivalent) and confirm no previously-passing test regresses.
- [x] 6.2 Run lint/typecheck and confirm they pass.
- [x] 6.3 Manually verify in a running dev server: the trigger shows the d20 icon, roll feed items show the icon (not the emoji), the dice panel opens as a sibling to the left of the chat drawer without overlapping it, and posting a roll scrolls it into view. NOTE: a real browser dev-server check was not possible in this worktree (no local `node_modules`, so Turbopack can't resolve its workspace root; a full auth+campaign+session flow would also need seeded DB state). Substituted with the full jsdom test suite, which asserts every scenario in this list directly (icon presence, DOM sibling placement/order/height, outside-click/Escape close, and scrollTo call on own-roll commit).
- [x] 6.4 Spawn a sub-agent to run the `openspec-review-code` skill (required pre-commit code review); apply all clearly-correct fixes silently and re-run tests before proceeding — do not present the findings list to the user or pause for confirmation.
- [ ] 6.5 Commit all changes, push the branch, and open a PR against the default branch with a `Closes #512` line in the body (per `proposal.md`'s GitHub issue reference), then enable auto-merge.
