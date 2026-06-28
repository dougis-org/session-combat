---
schema: 1
id: n016-use-sse-campaign-events-for-session-state-updates
kind: decision
title: "Use SSE campaign events for session-state updates instead of polling"
domains: ["campaigns", "realtime", "frontend"]
file_globs: []
confidence: 0.84
status: active
source: extractor
created_by: decision-promoter@gpt-5.4-mini
created_at: 2026-06-28T15:11:13.666113+00:00
updated_at: 2026-06-28T15:11:13.561+00:00
related: ["n015-model-session-lifecycle-as-its-own-campaign-stream"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use SSE campaign events for session-state updates instead of polling

Session lifecycle updates must travel through the existing campaign event stream, not a polling loop. The reason is twofold: the UI stays reactive with lower network churn, and session state remains part of the same stream-based architecture as other campaign updates. Apply this anywhere campaign/session state needs to be propagated to the layout or chat views; choosing polling here would diverge from the event-driven contract and add unnecessary request traffic.

## Related

**Related:**
- [[n015-model-session-lifecycle-as-its-own-campaign-stream]]

