---
schema: 1
id: n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb
kind: decision
title: "Store feedback rate limits in a TTL-backed MongoDB collection"
domains: ["mongodb", "feedback", "rate-limiting"]
file_globs: []
confidence: 0.87
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T16:32:02.850936+00:00
updated_at: 2026-06-28T16:32:02.756+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Store feedback rate limits in a TTL-backed MongoDB collection

Feedback submission throttling must use a dedicated MongoDB collection with a TTL index so each window expires automatically. This avoids coupling rate-limit state to the main feedback record and removes the need for a background cleanup job, which would be easy to forget and could leave stale limits blocking users. Apply this anywhere feedback submissions need server-side rate limiting or other short-lived per-user/per-session windows.
