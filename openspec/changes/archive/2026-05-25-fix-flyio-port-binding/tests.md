---
name: tests
description: Tests for the fix-flyio-port-binding change
---

# Tests

## Overview

The change is a single `fly.toml` addition — no application code changes. Tests are verification commands run before and after the change to confirm correctness.

## Test Cases

### Task 1 — fly.toml health check block

- [ ] **Pre-change assertion:** `grep "http_service.checks" fly.toml` returns no matches
- [ ] **Post-change assertion:** `grep -A 6 'http_service.checks' fly.toml` shows the block with `path = "/api/health"`
- [ ] **TOML validity:** Inspect `fly.toml` manually or run `flyctl config validate` — no parse errors

### Regression: App still healthy on canonical domain

- [ ] `curl -s https://dnd.dougis.com/api/health` returns `{"ok":true}` (HTTP 200)
- [ ] `curl -sI https://session-combat.fly.dev/api/health` still returns HTTP 308 (redirect unchanged — expected)

### Post-deploy: fly.io health check operational

- [ ] `flyctl checks list --app session-combat` shows a check for `/api/health` with status passing (manual, post-deploy)
- [ ] `flyctl status --app session-combat` shows machine as running/healthy

## Acceptance Scenario Mapping

| Test Case | Spec | Scenario |
|-----------|------|----------|
| fly.dev → 308 (confirmed unchanged) | specs/flyio-port-binding/spec.md | External probe via fly.dev hostname |
| dnd.dougis.com → 200 | specs/flyio-port-binding/spec.md | App is healthy on canonical domain |
| flyctl checks passing post-deploy | specs/flyio-health-check/spec.md | Health check passes after startup |
