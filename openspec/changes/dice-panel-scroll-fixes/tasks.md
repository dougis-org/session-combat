## 1. Icon sizes

- [ ] 1.1 In `DiceTriggerButton`, change `<DiceD20Icon width={16} height={16} .../>` to `width={24} height={24}`.
- [ ] 1.2 In `DicePoolPanel`'s per-die button, change `<Icon width={14} height={14} .../>` to `width={21} height={21}`.
- [ ] 1.3 Update/verify any test asserting the old 16px/14px icon dimensions in `tests/unit/components/CampaignChat/CampaignChat.dicePool.test.tsx`.

## 2. Tooltips

- [ ] 2.1 Add `title="Dice Rolls for main screen pop out"` to the trigger `<button>` in `DiceTriggerButton`.
- [ ] 2.2 Add `title={`d${sides}`}` to each per-die add button in `DicePoolPanel` (matching its existing `aria-label={`Add d${sides}`}`).
- [ ] 2.3 Add a test asserting the trigger button's `title` equals "Dice Rolls for main screen pop out".
- [ ] 2.4 Add a test asserting each per-die button's `title` equals its die label (`d4`…`d20`).

## 3. Dice panel content-driven height

- [ ] 3.1 Remove the `heightPx` prop from `DicePoolPanel`'s type and destructuring.
- [ ] 3.2 Remove `style={{ height: heightPx }}` from the panel's root `<div>`; keep `w-64 flex-shrink-0 overflow-y-auto` (or equivalent) so it still caps width and has a scroll fallback if content ever exceeds the viewport.
- [ ] 3.3 Remove the `heightPx={resolvedHeight}` prop from the `<DicePoolPanel>` call site (`CampaignChat.tsx:912`).
- [ ] 3.4 Update/add a test asserting the panel's rendered height reflects its content, not `resolvedHeight`/the drawer's height, when the drawer is resized to a large custom height.

## 4. Auto-scroll on any dice roll

- [ ] 4.1 Extract a `scrollToBottom()` helper (using `feedRef.current` and the existing `requestAnimationFrame` + `scrollTo({ top: scrollHeight, behavior: 'smooth' })` pattern) usable from both `handleRollPosted` and `onStreamEvent`'s `'roll'` branch.
- [ ] 4.2 Call `scrollToBottom()` from `handleRollPosted` after `setFeed`, replacing the `pendingScrollRef.current = true` assignment.
- [ ] 4.3 Call `scrollToBottom()` from `onStreamEvent`'s `'roll'` branch after `setFeed`, for every roll (not conditioned on who posted it).
- [ ] 4.4 Remove the now-unused `pendingScrollRef` and its `useEffect` keyed on `[feed]`.
- [ ] 4.5 Verify `onStreamEvent`'s `'message'` branch and the composer's optimistic message append do NOT call `scrollToBottom()` — auto-scroll stays scoped to dice rolls.
- [ ] 4.6 Add/update tests: self-roll scrolls (POST-response path), other-player roll scrolls (SSE path), a duplicate roll id (SSE echo racing the POST response) still scrolls exactly once, and a new chat message does not trigger scroll.

## 5. Verification

- [ ] 5.1 Run the full `CampaignChat`/dice-pool test suite and confirm all tests pass, including the updated/added tests above.
- [ ] 5.2 Manually smoke-test in a browser: open the dice panel, confirm no dead space below its controls at various drawer heights; roll a die and confirm the feed scrolls; confirm icons read clearly at the new size; confirm hovering each dice control shows its tooltip.
- [ ] 5.3 Mark this task list complete with a link to the resulting PR.
