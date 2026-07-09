---
schema: 1
id: n036-allow-membership-changes-by-self-or-active-dm-only
kind: decision
title: "Allow membership changes by self or active DM only"
domains: ["party", "authorization", "security"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-07-05T21:47:21.06193+00:00
updated_at: 2026-07-05T21:47:20.957+00:00
related: ["n035-preserve-party-membership-history-on-rejoin"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Allow membership changes by self or active DM only

Authorize party membership updates only for the member themself or an active DM membership. This protects party membership from unauthorized edits while still supporting self-service changes and GM-managed adjustments. Any code path that mutates another member’s party membership must enforce one of those two principals, or it is a security bug.

## Related

**Related:**
- [[n035-preserve-party-membership-history-on-rejoin]]

