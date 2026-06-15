## GitHub Issues

- #315
- #297 (parent epic: Phase 5 — Messaging)

## Why

- Problem statement: `CampaignChat` is a fully-wired dock shell (expand/collapse/pin) but carries no live data — the message area shows a static "No messages yet." placeholder. Users in an active campaign cannot send or receive messages via the UI.
- Why now: Issue 314 (5a) is complete — the `campaignMessages` collection, `POST`/`GET` API routes, stream event emission, and `CampaignMessage` type are all live. The front-end integration is the remaining blocker for Phase 5.
- Business/user impact: Without this, real-time campaign messaging is invisible to users despite the back-end being ready. DMs, group messages, and DM-only whispers cannot be composed or read.

## Problem Space

- Current behavior: `CampaignChat` is mounted in `app/layout.tsx` with no props. It has no `campaignId`, no stream connection, no message state, and no composer. The dock is a static shell.
- Desired behavior: When a user navigates to a campaign page (`/campaigns/[id]/…`), the chat dock connects to that campaign's SSE stream, loads message history, renders a scrollable feed with sender/timestamp/visibility markers, shows an unread badge when collapsed, and provides a composer with visibility selector and `@username` autocomplete for whisper (direct) targeting.
- Constraints:
  - `useCampaignStream` already exists and must be reused as-is (no signature changes).
  - The send API (`POST /api/campaigns/[id]/messages`) and history API (`GET /api/campaigns/[id]/messages`) are fixed contracts from issue 314.
  - The dock must remain `fixed`-positioned and out of document flow (no layout regressions).
  - Auth is JWT-cookie-based; `useAuth()` provides `{ userId, username }` client-side.
  - Tailwind + shadcn UI stack; no new UI library additions.
- Assumptions:
  - The chat dock is only meaningful inside a campaign route. It will not render on non-campaign pages.
  - Member list for whisper autocomplete is fetched by `CampaignChat` itself (not passed via props).
  - Unread count resets on dock open (not on scroll-to-bottom).
  - Unread state is per-campaign, persisted in `LocalStore` by key `campaign-chat-last-open-{campaignId}`.
  - Optimistic message append on send (show immediately, no rollback on error for MVP).
- Edge cases considered:
  - User sends a message while stream is disconnected (status `error`/`connecting`) — composer is disabled.
  - Stream delivers a message the sender just sent (deduplication by `id` required).
  - `@` typed at the start of a word with no matching members — dropdown shows empty/no match state.
  - Campaign with no other members — whisper option still shown but dropdown is empty.
  - History pagination returns fewer items than `perPage` — `hasMore` set to `false`.
  - LocalStore unavailable (private browsing) — unread count degrades gracefully (starts at 0).

## Scope

### In Scope

- Create `app/campaigns/[id]/layout.tsx` — new Next.js layout wrapping all campaign sub-routes; mounts `<CampaignChat campaignId={id} />`.
- Remove `<CampaignChat />` from `app/layout.tsx`.
- Add `campaignId: string` prop to `CampaignChat`; connect to `useCampaignStream`.
- Message feed: render `CampaignMessage[]` with `senderName`, formatted timestamp, visibility marker, and `text`.
- Unread badge on the collapsed pill: count stream messages received since `campaign-chat-last-open-{campaignId}` LocalStore timestamp; clear on open.
- History: load last 30 messages on dock open; infinite scroll (prepend older pages on scroll-to-top).
- Members fetch: `GET /api/campaigns/[id]/members` on mount; used only for `@mention` autocomplete.
- Composer: text `<textarea>`, visibility selector (Group / DM-only / Whisper), `@username` autocomplete overlay, Send button.
- `@mention` flow: detect `@word` in textarea, filter members by username prefix, pick from dropdown → sets `visibility = { scope: "direct", toUserId }`, replaces `@word` with `@username`.
- Send: `POST /api/campaigns/[id]/messages`; optimistic append; disable composer while sending or stream is down.
- Update `openspec/specs/campaign-chat-dock/spec.md` to reflect new prop and live-data requirements.

### Out of Scope

- Message editing or deletion.
- Rich text / markdown in messages.
- Emoji reactions.
- File or image attachments.
- Read receipts per message (only aggregate unread count).
- Push / browser notifications.
- Pagination UI controls (load-more button) — scroll-triggered only.
- Group DM (multiple direct recipients in one message).
- Message search.

## What Changes

- **NEW** `app/campaigns/[id]/layout.tsx` — campaign-scoped layout; mounts `CampaignChat`.
- **MODIFIED** `app/layout.tsx` — remove `CampaignChat` import and render.
- **MODIFIED** `lib/components/CampaignChat.tsx` — add `campaignId` prop; stream wiring; message state; feed render; unread badge; composer with visibility + `@mention`; history fetch + infinite scroll.
- **MODIFIED** `openspec/specs/campaign-chat-dock/spec.md` — add new requirements for live data, feed, unread, and composer.
- **NEW** `openspec/changes/issue-315-chat-dock-wire/specs/campaign-chat-wire/spec.md` — BDD specs for this change's additions.

## Risks

- Risk: `CampaignChat` file grows unwieldy as a single component.
  - Impact: Medium — harder to test and review.
  - Mitigation: Extract internal sub-components (`ChatFeed`, `ChatComposer`, `MentionDropdown`) as non-exported functions within the same file, keeping the public API surface unchanged.

- Risk: Stream deduplication failure causes duplicate messages in the feed.
  - Impact: Low-Medium — visible to user, confusing UX.
  - Mitigation: Deduplicate by `message.id` when appending stream events; history load skips messages whose `id` is already in state.

- Risk: LocalStore unavailable (private browsing, storage quota) causes unread badge errors.
  - Impact: Low — cosmetic only.
  - Mitigation: Wrap all LocalStore calls in try/catch; degrade to in-memory-only unread tracking.

- Risk: Campaign layout file (`app/campaigns/[id]/layout.tsx`) intercepts routing in an unexpected way.
  - Impact: Medium — could break sub-routes (`/combat`, `/library`, etc.) if not implemented correctly.
  - Mitigation: Layout only adds a client-side component mount and passes `{children}` through; no data fetching or redirect logic. Validate all sub-routes still render in tests.

- Risk: `@mention` autocomplete state gets out of sync with textarea cursor position.
  - Impact: Low — annoying UX, not a data loss risk.
  - Mitigation: Trigger detection on every `onChange`; clear mention state on blur or Escape.

## Open Questions

All design decisions have been resolved in the preceding exploration session (2026-06-14). No open questions remain.

- Confirmed: Option C (campaign layout) for `campaignId` sourcing.
- Confirmed: Independent member fetch inside `CampaignChat`.
- Confirmed: `@mention` autocomplete (not dropdown-only).
- Confirmed: Infinite scroll for history pagination.
- Confirmed: LocalStore-backed unread, keyed per campaign, cleared on open.

## Non-Goals

- Server-side rendering of message history (dock is client-only).
- Offline message queuing / sync.
- Notification sounds or desktop push.
- Admin moderation tools.
- Message threading or replies.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
