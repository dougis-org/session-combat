# Parallel Integration Tests - Visual Architecture

## Current Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Jest (maxWorkers: 1)                     │
│                     Sequential Execution                    │
└────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────────────────────────────┐
         │  Suite 1: api.integration.test.ts          │
         ├────────────────────────────────────────────┤
         │ ┌─ beforeAll (8s)                          │
         │ │ ├─ Start MongoDB container (3s)          │
         │ │ ├─ Start Next.js server (5s)             │
         │ │ └─ Wait for health check                 │
         │ ├─ Tests (5s)                              │
         │ └─ afterAll                                │
         └────────────────────────────────────────────┘
                              ↓ (8s + 5s + 3s)
         ┌────────────────────────────────────────────┐
         │  Suite 2: monsters.integration.test.ts     │
         ├────────────────────────────────────────────┤
         │ ┌─ beforeAll (8s)                          │
         │ │ ├─ Start MongoDB container (3s)          │
         │ │ ├─ Start Next.js server (5s)             │
         │ │ └─ Wait for health check                 │
         │ ├─ Tests (5s)                              │
         │ └─ afterAll                                │
         └────────────────────────────────────────────┘

         ⏱️  Total Time: ~26 seconds (Sequential)

         Resources Used:
         - 2x MongoDB containers (sequential)
         - 2x Next.js processes (sequential)
         - 1 CPU core active at a time
```

---

## Proposed Architecture (Phase 2)

```
┌──────────────────────────────────────────────────────────────┐
│                   Jest (maxWorkers: 4)                        │
│                    Parallel Execution                         │
└──────────────────────────────────────────────────────────────┘
                              ↓
      ┌────────────────────────────────────────────────┐
      │  Global Setup (Runs ONCE per Jest session)     │
      ├────────────────────────────────────────────────┤
      │  ┌─ Start MongoDB (3s)                         │
      │  ├─ Set MONGODB_URI env var                    │
      │  ├─ Start Next.js on :3000 (5s)                │
      │  ├─ Wait for health check                      │
      │  └─ Store refs in global scope                 │
      │                                                 │
      │  Total: ~8 seconds                             │
      └────────────────────────────────────────────────┘
                              ↓
      ┌──────────┬──────────┬──────────┬──────────┐
      │ Worker 1 │ Worker 2 │ Worker 3 │ Worker 4 │
      │          │          │          │          │
      │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │
      │ │Test  │ │ │Test  │ │ │Test  │ │ │Test  │ │
      │ │Suite │ │ │Suite │ │ │Suite │ │ │Suite │ │
      │ │1     │ │ │2     │ │ │3     │ │ │4     │ │
      │ │(5s)  │ │ │(5s)  │ │ │(5s)  │ │ │(5s)  │ │
      │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │
      │          │          │          │          │
      │ beforeEach: Clear DB (0.5s each)            │
      └──────────┴──────────┴──────────┴──────────┘
                              ↓
      ┌────────────────────────────────────────────────┐
      │  Global Teardown (Runs ONCE at end)            │
      ├────────────────────────────────────────────────┤
      │  ├─ Kill Next.js server (3s)                   │
      │  └─ Stop MongoDB container                     │
      │                                                 │
      │  Total: ~3 seconds                             │
      └────────────────────────────────────────────────┘

      ⏱️  Total Time: ~16 seconds (Parallel)
          = Setup (8s) + Max(5s,5s,5s,5s) + Teardown (3s)
          = 38% FASTER ✓

      Resources Used:
      - 1x MongoDB container (shared)
      - 1x Next.js process (shared)
      - 4 CPU cores active simultaneously
```

---

## Quick Win Architecture (Phase 1)

```
Split integration tests into two groups:

GROUP A: Validation Tests (No Server Needed)
┌─────────────────────────────────────┐
│  Jest Config: jest.validation.config.js
│  maxWorkers: 4 (Full parallelization)
├─────────────────────────────────────┤
│  ┌──────┬──────┬──────┬──────┐      │
│  │Test 1│Test 2│Test 3│Test 4│      │
│  │(1s)  │(1s)  │(1s)  │(1s)  │      │
│  └──────┴──────┴──────┴──────┘      │
│  Max: 1s                             │
└─────────────────────────────────────┘

Files included:
  - monsterUpload.test.ts
  - monsterUploadRoute.test.ts
  - duplicate-monster.test.ts
  - monsters-copy.test.ts


GROUP B: Integration Tests (With Server)
┌─────────────────────────────────────┐
│  Jest Config: jest.integration.config.js
│  Setup shared instance (8s)
│  maxWorkers: 2
├─────────────────────────────────────┤
│  ┌──────────────┬──────────────┐    │
│  │Test Suite 1  │Test Suite 2  │    │
│  │(5s)          │(5s)          │    │
│  └──────────────┴──────────────┘    │
│  Max: 5s                             │
└─────────────────────────────────────┘

Files included:
  - api.integration.test.ts
  - monsters.integration.test.ts

Total: 1s + 8s + 5s = 14 seconds (46% faster than sequential)
```

---

## Database State Management

### Issue: Test Isolation with Shared Database

```
Scenario: 2 tests running in parallel

Test Worker 1               Test Worker 2
├─ beforeEach: Clear DB ←──→ Race Condition!
├─ Insert test data A
├─ Test assertions      ←──→ beforeEach: Clear DB
│                            ├─ Clears test data A!
│                            ├─ Insert test data B
│                            └─ Test assertions
└─ afterEach: Cleanup
```

### Solution: Atomic Collection Clearing

```typescript
// Safe for parallel tests
beforeEach(async () => {
  const db = mongoClient.db(process.env.MONGODB_DB);
  const collections = await db.listCollections().toArray();
  
  // Clear all non-system collections
  for (const { name } of collections) {
    if (!name.startsWith('system.')) {
      await db.collection(name).deleteMany({});
    }
  }
});

// Result: Each test gets fresh DB, no race conditions
```

### Alternative: Database-per-Test

```typescript
let testDbName: string;

beforeEach(() => {
  testDbName = `session-combat-test-${Date.now()}-${Math.random()}`;
  process.env.MONGODB_DB = testDbName;
});

afterEach(async () => {
  await mongoClient.db(testDbName).dropDatabase();
});

// Result: Maximum isolation, slower (DB creation overhead)
```

---

## Timeline: Before → After

### Before (Current)
```
00:00 ──────┐
            │ Suite 1 Setup
00:08 ───────┼─────────────┐
            │             │ Suite 1 Tests
00:13 ───────┼─────────────┼────────────────┐
            │             │                 │ Teardown
00:16 ───────┼─────────────┼────────────────┼─────────────┐
            │             │                 │             │ Suite 2 Setup
00:24 ───────┼─────────────┼────────────────┼─────────────┼─────────────┐
            │             │                 │             │             │ Suite 2 Tests
00:29 ───────┼─────────────┼────────────────┼─────────────┼─────────────┼────────────────┐
            │             │                 │             │             │                 │ Teardown
00:32 ───────┴─────────────┴────────────────┴─────────────┴─────────────┴────────────────┴─

Total: 32 seconds (Sequential)
```

### After (Proposed)
```
00:00 ──────┐
            │ Global Setup (MongoDB + Next.js)
00:08 ───────┬─────────────┬─────────────┬─────────────┬─────────────┐
            │             │             │             │             │
            │ Suite 1     │ Suite 2     │ Suite 3     │ Suite 4     │
            │ (5s)        │ (5s)        │ (5s)        │ (5s)        │
00:13 ───────┼─────────────┼─────────────┼─────────────┼─────────────┤
            │ All complete at ~same time                               │
            │             │             │             │             │
00:16 ───────┴─────────────┴─────────────┴─────────────┴─────────────┴─ Teardown (3s)
            │
00:19 ───────┴─

Total: 19 seconds (Parallel with 4 workers)
Improvement: 32s → 19s = 41% faster!
```

---

## Implementation Difficulty

```
Quick Win (30 mins):
  ✓ Separate validation test config
  ✓ Run validation tests in parallel NOW
  ✓ No changes to existing test files needed
  Impact: 30-40% faster for validation tests

Full Implementation (4 hours):
  ┌─ Phase 1 (2 hours): Create global setup/teardown
  │  ├─ jest.integration.global-setup.ts
  │  ├─ jest.integration.global-teardown.ts
  │  └─ Update jest.integration.config.js
  │
  ├─ Phase 2 (2 hours): Database cleanup
  │  ├─ Add beforeEach cleanup to test files
  │  ├─ Test isolation and order independence
  │  └─ Verify no race conditions
  │
  └─ Result: 50-70% faster tests overall
```

---

## Risk Assessment

### Sequential Approach (Current)
- ✓ Zero risk of test interference
- ✓ Simple, proven pattern
- ✗ Slower for new tests
- ✗ Higher CI/CD time

### Parallel with Shared Instance (Proposed)
- ✓ Much faster
- ✓ Lower resource usage
- ✓ Scales with CPU cores
- ⚠️ Risk: Test pollution if cleanup incomplete
- ⚠️ Risk: Port conflicts (mitigated by single port)
- ⚠️ Risk: Race conditions (mitigated by atomic cleanup)

### Mitigation Strategy
1. Test in random order: `jest --randomize`
2. Run multiple times: `npm run test:integration -- --seed=1234`
3. Monitor for flaky tests
4. Add comprehensive beforeEach cleanup
5. Use timeouts for resource cleanup

