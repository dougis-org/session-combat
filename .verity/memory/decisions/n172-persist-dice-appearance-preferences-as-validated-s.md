---
schema: 1
id: n172-persist-dice-appearance-preferences-as-validated-s
kind: decision
title: "Persist dice appearance preferences as validated scalar IDs"
domains: ["dice", "preferences", "persistence"]
file_globs: []
confidence: 0.88
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-09-01T00:41:09.450358+00:00
updated_at: 2026-09-01T00:41:09.354+00:00
related: ["n165-use-a-shared-numeric-chip-readout-for-pool-and-per", "n163-apply-vendor-fixes-with-exact-version-patch-packag"]
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Persist dice appearance preferences as validated scalar IDs

Dice appearance preferences must be stored and consumed as validated scalar registry IDs rather than arbitrary objects or unvalidated values. This keeps local persistence stable, allows the preference schema to evolve toward `PreferenceValues.dice`, and prevents stale, edited, or unknown storage data from selecting invalid appearances. Apply this wherever dice appearance preferences are read, validated, migrated, or persisted.

## Related

**Related:**
- [[n165-use-a-shared-numeric-chip-readout-for-pool-and-per]]
- [[n163-apply-vendor-fixes-with-exact-version-patch-packag]]

