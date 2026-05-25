## Context

- Relevant architecture: Next.js 16 app on fly.io. fly.io uses two distinct health check layers: (1) the **Fly Doctor CLI** tool that probes the public hostname externally, and (2) the **machine-level `[http_service.checks]`** that probes the machine's internal IP and port directly. The redirect in `next.config.js` only affects layer (1).
- Dependencies: `fly.toml`, `app/api/health/route.ts` (existing, returns `{ ok: true }`).
- Interfaces/contracts touched: fly.io health check configuration only.

## Goals / Non-Goals

### Goals

- Give fly.io an explicit HTTP health check that probes `/api/health` on the machine's internal port, immune to the hostname-based redirect.
- Silence the operational alert without changing application code, Dockerfile, or the redirect.

### Non-Goals

- Fixing Fly Doctor's external probe — it probes `session-combat.fly.dev` which will always return 308 while the redirect exists. Fly Doctor is a CLI diagnostic, not an operational check.
- Removing or modifying the redirect.
- Changing build infrastructure.

## Decisions

### Decision 1: Add `[http_service.checks]` to fly.toml targeting `/api/health`

- Chosen: Add a single `[http_service.checks]` block with `path = "/api/health"`, `interval = "15s"`, `timeout = "5s"`, `grace_period = "30s"`, `method = "GET"`.
- Alternatives considered:
  - Do nothing — the app works; the alert is cosmetic. Rejected because a persistent unresolved alert creates noise and could mask a real failure.
  - Set `min_machines_running = 1` to keep machine always warm — would eliminate the stopped-machine false positive, but costs money and is out of scope for this fix.
  - Add a separate `/api/health-internal` route with no redirect — unnecessary; fly.io internal checks use the machine IP, not the hostname, so the existing `/api/health` already serves the purpose.
- Rationale: fly.io's `[http_service.checks]` probes bypass hostname routing. `/api/health` returns 200 when probed on the internal IP, confirming the app is running.
- Trade-offs: Adds a periodic HTTP check (negligible traffic). Grace period of 30s means a cold-start has time to complete before being marked unhealthy.

## Proposal to Design Mapping

- Proposal element: Add `[http_service.checks]` to `fly.toml`
  - Design decision: Decision 1
  - Validation approach: After deploy, `flyctl checks list --app session-combat` shows check passing; `curl -sI https://dnd.dougis.com/api/health` returns 200

## Functional Requirements Mapping

- Requirement: fly.io must have an application-level HTTP health check immune to the hostname redirect
  - Design element: Decision 1
  - Acceptance criteria reference: flyio-health-check spec
  - Testability notes: `flyctl checks list --app session-combat` shows status passing; `/api/health` on internal IP returns 200

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: fly.io operational health status reflects true app liveness
  - Design element: Decision 1
  - Acceptance criteria reference: flyio-health-check spec
  - Testability notes: fly.io dashboard or `flyctl status` shows machine as healthy after deploy

## Risks / Trade-offs

- Risk/trade-off: Health check fails during cold-start (auto-stop wake-up).
  - Impact: Transient check failure; not user-facing; fly.io retries.
  - Mitigation: 30-second grace period accommodates Next.js startup. Reduce to 15s if startup is consistently faster.

## Rollback / Mitigation

- Rollback trigger: Health check causes fly.io to mark the machine unhealthy and stop routing traffic unexpectedly.
- Rollback steps: Remove `[http_service.checks]` from `fly.toml`, commit, `flyctl deploy --remote-only`.
- Data migration considerations: None.
- Verification after rollback: `flyctl status` shows machine running; `curl https://dnd.dougis.com/api/health` returns 200.

## Operational Blocking Policy

- If CI checks fail: Do not merge; diagnose and fix.
- If security checks fail: Do not merge; address findings.
- If required reviews are blocked/stale: Re-request after 24h. Production is not impacted by the Fly Doctor alert, so urgency is low.
- Escalation path and timeout: No escalation needed — app is working. Fix can proceed at normal velocity.

## Open Questions

No open questions.
