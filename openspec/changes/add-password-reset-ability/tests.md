---
name: tests
description: Test plan for add-password-reset-ability
---

# Tests

## Overview

This change is design-only. No production code changes are implemented in this
phase. The following tests define expected validation once implementation starts.

## Planned test cases

- [ ] Unit: forgot endpoint returns identical body for known vs unknown email.
- [ ] Unit: token generation uses crypto RNG and stores hash only.
- [ ] Unit: token TTL expiry check rejects expired tokens.
- [ ] Unit: consumed token cannot be reused.
- [ ] Integration: reset updates password hash and invalidates old session.
- [ ] Integration: rate limit paths throttle excessive forgot/reset attempts.
- [ ] Integration: successful reset allows login with new password only.
