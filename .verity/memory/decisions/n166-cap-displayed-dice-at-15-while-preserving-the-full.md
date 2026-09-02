---
schema: 1
id: n166-cap-displayed-dice-at-15-while-preserving-the-full
kind: decision
title: "Cap displayed dice at 15 while preserving the full-pool total"
domains: ["dice", "modal-ui", "large-pools"]
file_globs: []
confidence: 0.83
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T05:00:55.784208+00:00
updated_at: 2026-08-31T05:00:55.674+00:00
related: ["n163-apply-vendor-fixes-with-exact-version-patch-packag", "n051-centralize-unbiased-dice-generation-behind-a-rejec", "n165-use-a-shared-numeric-chip-readout-for-pool-and-per"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Cap displayed dice at 15 while preserving the full-pool total

Numeric dice result modals must display at most 15 individual die values and show a remainder note for additional dice. This keeps the readout synchronized with the animated subset and prevents large pools from overwhelming the modal, while the note preserves the user-visible total of the complete pool. Apply this to pooled result readouts.

## Related

**Related:**
- [[n163-apply-vendor-fixes-with-exact-version-patch-packag]]
- [[n051-centralize-unbiased-dice-generation-behind-a-rejec]]
- [[n165-use-a-shared-numeric-chip-readout-for-pool-and-per]]

