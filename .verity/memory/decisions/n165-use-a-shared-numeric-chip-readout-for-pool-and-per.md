---
schema: 1
id: n165-use-a-shared-numeric-chip-readout-for-pool-and-per
kind: decision
title: "Use a shared numeric-chip readout for pool and percentile dice"
domains: ["dice", "modal-ui", "rendering"]
file_globs: []
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T05:00:54.641509+00:00
updated_at: 2026-08-31T05:00:54.538+00:00
related: ["n163-apply-vendor-fixes-with-exact-version-patch-packag", "n051-centralize-unbiased-dice-generation-behind-a-rejec"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Use a shared numeric-chip readout for pool and percentile dice

Numeric dice results must use one chip-based presentation path for both pool and percentile dice. This accurately represents predetermined values, including die sizes without available face artwork, and avoids implying a graphical die roll when the modal is displaying exact numbers. Apply this rule to numeric dice result-modal rendering.

## Related

**Related:**
- [[n163-apply-vendor-fixes-with-exact-version-patch-packag]]
- [[n051-centralize-unbiased-dice-generation-behind-a-rejec]]

