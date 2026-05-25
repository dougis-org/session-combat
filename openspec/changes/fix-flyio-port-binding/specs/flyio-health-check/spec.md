## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED fly.io performs HTTP health check on `/api/health`

The system SHALL have an explicit HTTP health check configured in `fly.toml` that probes `GET /api/health` every 15 seconds with a 5-second timeout and 30-second grace period.

#### Scenario: Health check passes after startup

- **Given** the fly.toml `[http_service.checks]` block is configured with `path = "/api/health"`, `interval = "15s"`, `timeout = "5s"`, `grace_period = "30s"`, `method = "GET"`
- **When** the container has started and `next start` is serving requests
- **Then** `flyctl checks list --app session-combat` shows the check status as passing and `GET /api/health` returns HTTP 200 with body `{"ok":true}`

#### Scenario: Health check detects an unresponsive app

- **Given** the app process has stopped but the container has not yet been restarted
- **When** fly.io probes `GET /api/health` and receives no response within 5 seconds
- **Then** fly.io marks the machine as unhealthy and triggers a restart

## MODIFIED Requirements

No existing requirements are modified by this spec.

## REMOVED Requirements

No requirements are removed by this spec.

## Traceability

- Proposal element "Add `[http_service.checks]` to `fly.toml`" -> Requirement: ADDED fly.io performs HTTP health check
- Design decision 3 (health check config) -> Requirement: ADDED fly.io performs HTTP health check
- Requirement: ADDED fly.io performs HTTP health check -> Task: Add health check to fly.toml

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Health status visible in fly.io dashboard

- **Given** the updated `fly.toml` is deployed
- **When** an operator views the fly.io dashboard or runs `flyctl status --app session-combat`
- **Then** the machine health status is shown as running/healthy without needing to inspect logs

### Requirement: Reliability

#### Scenario: Health check does not redirect

- **Given** the `/api/health` route is an API route (not subject to the `session-combat.fly.dev` → `dnd.dougis.com` redirect in `next.config.js`)
- **When** fly.io probes `GET /api/health` on the machine's internal IP
- **Then** the response is HTTP 200 with no redirect interception
