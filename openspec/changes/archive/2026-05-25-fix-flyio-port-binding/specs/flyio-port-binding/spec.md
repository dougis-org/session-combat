## Context

This spec documents the confirmed state of the port-binding issue and its root cause. No code changes are required for this capability — the app IS listening on port 3000. The Fly Doctor alert is a false positive.

## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Fly Doctor alert is acknowledged as false positive

The system SHALL document that `session-combat.fly.dev/api/health` returns HTTP 308 by design (intentional redirect from PR #217) and that the app is healthy at `dnd.dougis.com/api/health`.

#### Scenario: External probe via fly.dev hostname

- **Given** the redirect in `next.config.js` that redirects `session-combat.fly.dev` → `dnd.dougis.com`
- **When** any client (including Fly Doctor) sends `GET https://session-combat.fly.dev/api/health`
- **Then** the response is HTTP 308 with `location: https://dnd.dougis.com/api/health` — this is correct and expected behavior

#### Scenario: App is healthy on canonical domain

- **Given** the app is running
- **When** `GET https://dnd.dougis.com/api/health` is requested
- **Then** the response is HTTP 200 with body `{"ok":true}`

## MODIFIED Requirements

No requirements modified.

## REMOVED Requirements

No requirements removed.

## Traceability

- Proposal element: Fly Doctor alert is false positive from 308 redirect → Requirement: ADDED Fly Doctor alert is acknowledged
- Design decision 1 (health check config) → specs/flyio-health-check/spec.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: App continues serving real user traffic despite Fly Doctor alert

- **Given** the redirect returns 308 to Fly Doctor probes
- **When** a real user visits `dnd.dougis.com`
- **Then** the app responds correctly — the Fly Doctor alert has no impact on user-facing traffic routing
