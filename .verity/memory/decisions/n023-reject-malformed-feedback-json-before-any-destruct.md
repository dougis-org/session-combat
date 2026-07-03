---
schema: 1
id: n023-reject-malformed-feedback-json-before-any-destruct
kind: decision
title: "Reject malformed feedback JSON before any destructuring"
domains: ["feedback", "api", "security"]
file_globs: []
confidence: 0.86
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-30T22:28:17.432214+00:00
updated_at: 2026-06-30T22:28:17.337+00:00
related: ["n022-restrict-feedback-issue-context-urls-to-same-origi", "n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Reject malformed feedback JSON before any destructuring

Feedback request handlers must parse JSON with a null fallback and treat non-object payloads as invalid before reading fields. This avoids crashes from malformed input, keeps validation behavior deterministic, and prevents later logic from operating on arrays, primitives, or absent bodies. Apply this to feedback API request processing whenever request data is parsed before field extraction or issue creation.

## Related

**Related:**
- [[n022-restrict-feedback-issue-context-urls-to-same-origi]]
- [[n018-store-feedback-rate-limits-in-a-ttl-backed-mongodb]]

