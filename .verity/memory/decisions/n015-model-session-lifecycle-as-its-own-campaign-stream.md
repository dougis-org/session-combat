---
schema: 1
id: n015-model-session-lifecycle-as-its-own-campaign-stream
kind: decision
title: "Model session lifecycle as its own campaign stream event variant"
domains: ["campaigns", "event-streaming", "typescript"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T15:10:24.557448+00:00
updated_at: 2026-06-28T15:10:24.445+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Model session lifecycle as its own campaign stream event variant

Keep session lifecycle updates distinct from message and roll events. A dedicated `session` variant prevents payloads from being overloaded with unrelated semantics, which makes stream consumers simpler and avoids brittle type checks when new lifecycle transitions are added. Apply this whenever the campaign event stream carries both content events and session state changes; do not reuse message/roll event shapes for session updates.
