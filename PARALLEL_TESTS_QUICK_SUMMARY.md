# Integration Test Parallelization - Quick Summary

## Current Situation

**Status:** Integration tests run **sequentially** (one at a time)

- `jest.integration.config.js`: `maxWorkers: 1`
- Each test suite starts its own MongoDB container and Next.js server
- This is safe but slow (26s for 3 test suites)

### Current Test Files
1. ✓ `api.integration.test.ts` - Uses full setup/teardown
2. ✓ `monsters.integration.test.ts` - Uses full setup/teardown  
3. ✗ `monsterUpload.test.ts` - **Pure validation, NO server needed**
4. ✗ `monsterUploadRoute.test.ts` - **Pure validation tests, NO server**
5. ✗ `duplicate-monster.test.ts` - **Unit tests with mocks, NO server**
6. ✗ `monsters-copy.test.ts` - **Placeholder tests, NO server**

## Recommendation

### Immediate Win: Separate Test Groups
Split into two Jest runs:

**Group 1: Validation/Unit Tests** (no setup needed)
- `monsterUpload.test.ts`
- `monsterUploadRoute.test.ts`
- `duplicate-monster.test.ts`
- `monsters-copy.test.ts`
- Run with: `jest --testPathPattern="(monsterUpload|duplicate-monster|monsters-copy)"`
- **Can run in parallel NOW** (maxWorkers: 4+)

**Group 2: Integration Tests** (shared instance)
- `api.integration.test.ts`
- `monsters.integration.test.ts`
- Run with: `jest --testPathPattern="api|monsters\.integration"`
- Configure with shared global setup/teardown

### Implementation Approach (3 Phases)

#### Phase 1: Global Setup (1-2 hours)
- Create `jest.integration.global-setup.ts` (starts MongoDB + Next.js once)
- Create `jest.integration.global-teardown.ts` (cleanup)
- Update `jest.integration.config.js`
- No test file changes needed yet

**Result:** Tests can run in parallel but may have isolation issues

#### Phase 2: Database Isolation (1-2 hours)
- Add `beforeEach` cleanup to test files
- Each test clears collections or uses unique database
- Verify tests pass in random order

**Result:** Safe parallel execution

#### Phase 3: Scale Up (30 mins)
- Adjust `maxWorkers` based on CPU cores
- Fine-tune timeouts
- Monitor performance

**Result:** 50-70% faster tests

---

## Quick Wins Available Now

### 1. Parallel Validation Tests (10 mins)
Create separate Jest config for validation-only tests:

**`jest.validation.config.js`:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**(monsterUpload|duplicate-monster|monsters-copy).test.(ts|js)'],
  maxWorkers: 4, // Can be fully parallel
  testTimeout: 30000,
};
```

**Update `package.json`:**
```json
{
  "scripts": {
    "test:validation": "jest --config=jest.validation.config.js",
    "test:server": "jest --config=jest.integration.config.js --testPathPattern='api|monsters\\.integration'",
    "test:integration": "npm run test:validation && npm run test:server"
  }
}
```

**Expected Time:** 30-40s → 10-15s (3-4x faster for validation tests)

### 2. Increase maxWorkers for Current Setup (2 mins)
```javascript
// jest.integration.config.js
maxWorkers: 2, // From 1
```

This allows 2 sequential test suites to overlap startup:
- Test 1 starts, MongoDB/Next.js starting
- While waiting, test 2 starts its own containers
- Could be 30-40% faster with minimal risk

**Trade-off:** Higher resource usage, slight risk of port conflicts

---

## Performance Metrics to Track

Before implementation:
```bash
npm run test:integration  # Note time
```

After Phase 1 (global setup only):
```bash
time npm run test:integration
```

After Phase 2 (full parallelization):
```bash
time npm run test:integration
```

---

## Architecture Comparison

### Current (Sequential)
```
Suite 1: |--setup--|--tests--|--teardown--|
Suite 2:                      |--setup--|--tests--|--teardown--|
Suite 3:                                            |--setup--|--tests--|--teardown--|
```
Total: ~26 seconds

### After Phase 1-2 (Shared Instance)
```
Setup:     |--MongoDB--|--Next.js--|
Tests:                 |---1---|---2---|---3---|---4---|
Teardown:                                        |--cleanup--|
```
Total: ~16 seconds (38% improvement)

### With Quick Win (Separate Validation)
```
Validation: |--1--|--2--|--3--|--4--| (parallel)
Then:
Setup:     |--MongoDB--|--Next.js--|
Tests:                 |---1---|---2---|
```
Total: ~18-20 seconds (23-30% improvement, easier to implement)

---

## Recommendation Priority

1. **Quick Win First**: Separate validation tests (10 mins, 3-4x faster for those)
2. **Then Phase 1**: Global setup/teardown (2 hours, adds foundation)
3. **Then Phase 2**: Database isolation (2 hours, ensures safety)
4. **Then Phase 3**: Performance tuning (30 mins, max throughput)

---

## Key Files to Create

1. `jest.integration.global-setup.ts` - Start shared resources
2. `jest.integration.global-teardown.ts` - Clean shared resources
3. `jest.validation.config.js` - Separate config for validation tests
4. Updated `jest.integration.config.js` - Reference global setup/teardown

## Key Files to Modify

1. `jest.integration.config.js` - Add globalSetup, globalTeardown, increase maxWorkers
2. `tests/integration/api.integration.test.ts` - Remove its own setup/teardown
3. `tests/integration/monsters.integration.test.ts` - Remove its own setup/teardown
4. `package.json` - Add new test scripts

