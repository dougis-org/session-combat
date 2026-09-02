---
schema: 1
id: n168-pin-patched-dependencies-to-the-exact-version-targ
kind: decision
title: "Pin patched dependencies to the exact version targeted by the patch"
domains: ["dependencies", "patching", "reproducibility"]
file_globs:
  - "package.json"
confidence: 0.9
status: active
source: extractor
created_by: decision-promoter@gpt-5.6-luna
created_at: 2026-08-31T05:18:02.476852+00:00
updated_at: 2026-08-31T05:18:02.367+00:00
related: []
supersedes: []
superseded_by: null
contradicts: []
caused_by: []
example_of: []
---

# Pin patched dependencies to the exact version targeted by the patch

Dependencies modified through patch-package must remain pinned to the exact version the patch targets. A version range could resolve to a release whose source no longer matches the patch, causing installation or build failures and undermining reproducibility. Apply this rule whenever a dependency has a checked-in patch, including the dice-box integration.
