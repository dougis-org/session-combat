## GitHub Issues

## Why

- Problem statement: After merging PR #217 (commit 441daf7), Fly Doctor reports "App is not listening to the expected port." The app is working correctly for users at dnd.dougis.com. The alert is a false positive: Fly Doctor probes `session-combat.fly.dev` externally and receives a **308 redirect** to `dnd.dougis.com` instead of a 200, which it misinterprets as a port binding failure.
- Why now: PR #217 added a host-based redirect in `next.config.js` that redirects all `session-combat.fly.dev` traffic to `dnd.dougis.com`. This is the direct cause of the Fly Doctor alert.
- Business/user impact: No current user-facing impact — the app is healthy. Risk is that the alert creates noise or, if fly.io ever acts on repeated external-check failures, traffic routing could be disrupted.

## Problem Space

- Current behavior:
  - `GET https://session-combat.fly.dev/api/health` → HTTP 308 → redirects to `https://dnd.dougis.com/api/health`
  - `GET https://dnd.dougis.com/api/health` → HTTP 200 `{"ok":true}`
  - Fly Doctor (a CLI diagnostic tool) probes the external fly.dev URL and does not follow the redirect; it reports the app as "not listening"
  - fly.io's internal machine health check (TCP on port 3000) is unaffected — it probes the machine's internal IP directly, bypassing Next.js hostname routing entirely
- Desired behavior: fly.io has a reliable application-level HTTP health check that probes the machine internally and always returns 200, independent of hostname routing
- Constraints: Do not remove the redirect — it is intentional and correct. Do not change application code. The fix should be entirely in fly.io configuration.
- Assumptions: fly.io `[http_service.checks]` probes use the machine's internal IP and port (3000), not the public hostname. This means the host-based redirect in Next.js does not apply to internal checks. Verified: `session-combat.fly.dev/api/health` → 308; `dnd.dougis.com/api/health` → 200.
- Edge cases considered:
  - `auto_stop_machines = 'stop'` with `min_machines_running = 0` means the machine is stopped when idle. If Fly Doctor runs while the machine is stopped, it would also report "not listening" — but this would be a separate issue from the redirect.
  - fly.io's internal health probes do not send `Host: session-combat.fly.dev` — they use the machine's internal IP address. The redirect rule's `has: [{ type: "host", value: "session-combat.fly.dev" }]` condition is never satisfied, so the redirect does not fire for internal probes regardless of path.

## Scope

### In Scope

- Add `[http_service.checks]` block to `fly.toml` pointing at `/api/health` on the internal port. This gives fly.io an explicit application-level health check that bypasses the hostname redirect.

### Out of Scope

- Changes to `next.config.js` — the redirect is intentional.
- Changes to `Dockerfile` or `docker-entrypoint.js` — these are not the cause of the alert.
- Changes to `min_machines_running` — the machine stopping when idle is expected behavior.
- Changes to any application code.

## What Changes

- `fly.toml`: add `[http_service.checks]` section with `path = "/api/health"`, `interval = "15s"`, `timeout = "5s"`, `grace_period = "30s"`, `method = "GET"`

## Risks

- Risk: The health check adds a small amount of periodic HTTP traffic to the app.
  - Impact: Negligible — one GET to `/api/health` every 15 seconds.
  - Mitigation: None needed.
- Risk: If the app is auto-stopped and fly.io's health check fires, the check may fail during cold-start (before the grace period expires).
  - Impact: Transient health check failure during cold-start; not user-facing.
  - Mitigation: The 30-second grace period covers normal Next.js startup time.

## Open Questions

No open questions. The root cause is confirmed (redirect → 308 on external probe), the app is confirmed healthy, and the fix is a one-line TOML addition.

## Non-Goals

- Eliminating the Fly Doctor alert entirely — Fly Doctor probes the external hostname and will continue to see a 308. The goal is to give fly.io's operational health system a reliable internal check.
- Achieving zero downtime during cold-starts — auto-stop is intentional and accepted.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
