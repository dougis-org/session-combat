---
schema: 1
id: n043-route-storage-events-through-one-logging-seam-for
kind: decision
title: "Route storage events through one logging seam for future telemetry"
domains: ["storage", "logging", "telemetry", "observability"]
file_globs: []
confidence: 0.91
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-16T15:29:23.323804+00:00
updated_at: 2026-08-16T15:29:23.29+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Route storage events through one logging seam for future telemetry

Storage-related operational events must pass through a shared logging seam rather than being emitted independently by each method. This preserves one integration point for consistent event shape and error context, and allows metrics or OpenTelemetry exporters to be added without revisiting every storage implementation. Apply to storage adapters and their operation helpers.
