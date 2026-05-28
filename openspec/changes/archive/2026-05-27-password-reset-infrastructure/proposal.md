## GitHub Issue

- dougis-org/session-combat#265 (this change — Part 1 of 3)
- Parent: dougis-org/session-combat#208 (full password reset feature)
- Prerequisite: dougis-org/session-combat#207 ✅ merged

## Why

The password reset flow (#208) requires three backend library modules and a DB
index before any endpoint or UI work can begin. Implementing these as a
standalone unit keeps the PR small, independently reviewable, and fully testable
without the HTTP layer.

## Problem Space

- No rate limiting infrastructure exists — needed to protect forgot/reset endpoints from abuse.
- No email sending infrastructure exists — needed to deliver reset links.
- No reset-token lifecycle exists — needed to generate, hash, store, validate, and consume one-time tokens.
- The `password_reset_tokens` MongoDB collection needs a unique index on `tokenHash` for O(1) lookup.

## Scope

### In Scope

- `lib/rate-limit.ts` — in-memory IP + email keyed rate limiter (Map + TTL).
- `lib/email.ts` — Mailtrap.io sender via `mailtrap` npm SDK.
- `lib/reset-tokens.ts` — token generate / hash / store / validate / consume helpers.
- `lib/db.ts` — add unique index on `password_reset_tokens.tokenHash` in `initializeDatabase()`.
- Unit tests for all three lib modules.
- `.env.example` entries for `MAILTRAP_TOKEN`, `MAILTRAP_FROM_EMAIL`, `APP_URL`.

### Out of Scope

- API endpoints (Part 2 — #266).
- UI pages (Part 3 — #267).
- Redis/MongoDB-backed rate limiting (future, if horizontal scaling required).

## Risks

- In-memory rate limiter state is wiped on cold start (`auto_stop_machines = stop` in fly.toml). Acceptable at current scale; document in `lib/rate-limit.ts`.
- Mailtrap misconfiguration could silently drop emails. Covered by `.catch(log)` in the forgot endpoint (Part 2).

## Non-Goals

- Production email provider migration (Mailtrap is the chosen provider).
- TTL index on `password_reset_tokens` (expiry handled in application logic).

## Change Control

Design reference: `openspec/changes/add-password-reset-ability/design.md` (D1–D7).
If requirements change, update that design document before modifying this change's tasks.
