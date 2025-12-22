# Parallel Integration Tests with Shared App Instance

## Current State

Currently, the integration tests are configured to run **sequentially** (`maxWorkers: 1` in `jest.integration.config.js`). Each test suite:

1. Starts its **own MongoDB container**
2. Starts its **own Next.js server instance** on a dynamically allocated port
3. Runs tests against that instance
4. Tears down both the container and server

This approach is **safe but inefficient**:
- ✅ Zero test interference
- ✅ Complete isolation
- ❌ Slow (multiple startup times: MongoDB + Next.js build output)
- ❌ Resource intensive (multiple containers and processes)

### Current Test Files
- `api.integration.test.ts` - Basic API tests
- `monsters.integration.test.ts` - Monster CRUD operations
- `monsterUpload.test.ts` - Pure validation (no server needed)
- `monsterUploadRoute.test.ts` - Upload route tests
- `duplicate-monster.test.ts` - Duplicate detection tests
- `monsters-copy.test.ts` - Monster copy functionality

---

## Proposed Solution: Single Shared Instance with Parallel Tests

### Architecture

```
┌─────────────────────────────────────────────┐
│  Jest (maxWorkers: N)                       │
│  ┌──────────────┬──────────────┬──────────┐ │
│  │ Test Suite 1 │ Test Suite 2 │ Test N   │ │
│  │ (Workers)    │ (Workers)    │ (Workers)│ │
│  └──────────────┴──────────────┴──────────┘ │
│                    ↓                         │
│  ┌─────────────────────────────────────────┐ │
│  │ Shared GlobalSetup/Teardown             │ │
│  │ (Runs once per Jest session)            │ │
│  └─────────────────────────────────────────┘ │
│                    ↓                         │
│  ┌──────────────────────┬──────────────────┐ │
│  │ MongoDB Container    │ Next.js Server   │ │
│  │ (Shared)             │ (Shared, port 3000)
│  └──────────────────────┴──────────────────┘ │
└─────────────────────────────────────────────┘
```

### Benefits

1. **Single startup overhead** - MongoDB and Next.js start once
2. **Parallel test execution** - Multiple test workers run concurrently
3. **Shared database** - All tests use same container instance
4. **Better resource utilization** - Fewer containers, more CPU for actual tests
5. **Faster CI/CD** - Significant time savings (potentially 50-70%)

### Tradeoffs

| Aspect | Current | Parallel Shared |
|--------|---------|-----------------|
| Test isolation | Perfect | Good (via database cleanup) |
| Speed | Slow (sequential) | Fast (parallel) |
| Resource usage | High (N instances) | Low (1 instance) |
| Test pollution risk | None | Low if cleanup proper |
| Complexity | Simple | Moderate |
| CI/CD friendliness | ✓ | ✓ |

---

## Implementation Strategy

### Phase 1: Setup Global Fixtures

Create a Jest global setup/teardown that manages shared resources.

**File: `jest.integration.global-setup.ts`**
```typescript
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

let mongoContainer: StartedMongoDBContainer | null = null;
let nextProcess: ChildProcess | null = null;

async function waitForServer(url: string, maxAttempts = 60, delay = 1000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      if (response.ok) return;
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Server not ready at ${url} after ${maxAttempts * delay}ms`);
}

export default async function globalSetup() {
  try {
    console.log('\n🚀 Starting global setup for integration tests...');
    
    // Start MongoDB
    console.log('📦 Starting MongoDB container...');
    mongoContainer = await new MongoDBContainer('mongo:8')
      .withExposedPorts(27017)
      .start();
    
    const mongoUri = mongoContainer.getConnectionString();
    console.log('✓ MongoDB ready at:', mongoUri);
    
    // Set environment variables
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_DB = 'session-combat-test';
    process.env.NODE_ENV = 'production';
    process.env.HOSTNAME = '0.0.0.0';
    process.env.PORT = '3000';
    
    // Start Next.js server
    console.log('⚙️ Starting Next.js server...');
    nextProcess = spawn('npx', ['next', 'start'], {
      env: process.env,
      stdio: 'pipe',
      detached: true,
    });
    
    // Capture logs
    nextProcess.stdout?.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('started') || msg.includes('ready') || msg.includes('listening')) {
        console.log('  [Next.js]', msg.trim());
      }
    });
    
    nextProcess.stderr?.on('data', (data) => {
      console.error('  [Next.js Error]', data.toString().trim());
    });
    
    // Wait for server
    console.log('⏳ Waiting for server to be ready...');
    await waitForServer('http://localhost:3000/api/health', 60, 2000);
    console.log('✓ Server ready\n');
    
    // Store references for global teardown
    (global as any).__MONGO_CONTAINER__ = mongoContainer;
    (global as any).__NEXT_PROCESS__ = nextProcess;
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    
    // Cleanup on failure
    if (nextProcess?.pid) {
      try {
        process.kill(-nextProcess.pid, 'SIGTERM');
      } catch (e) {
        nextProcess.kill('SIGTERM');
      }
    }
    if (mongoContainer) {
      await mongoContainer.stop();
    }
    throw error;
  }
}
```

**File: `jest.integration.global-teardown.ts`**
```typescript
import { StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ChildProcess } from 'child_process';

export default async function globalTeardown() {
  console.log('\n🧹 Starting global teardown...');
  
  const mongoContainer = (global as any).__MONGO_CONTAINER__ as StartedMongoDBContainer | undefined;
  const nextProcess = (global as any).__NEXT_PROCESS__ as ChildProcess | undefined;
  
  try {
    // Kill Next.js server
    if (nextProcess?.pid) {
      console.log('🛑 Stopping Next.js server (PID: ' + nextProcess.pid + ')');
      try {
        process.kill(-nextProcess.pid, 'SIGTERM');
      } catch (err) {
        nextProcess.kill('SIGTERM');
      }
      // Give it time to shutdown gracefully
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Stop MongoDB
    if (mongoContainer) {
      console.log('🛑 Stopping MongoDB container');
      await mongoContainer.stop();
    }
    
    console.log('✓ Cleanup complete\n');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
    throw error;
  }
}
```

### Phase 2: Update Jest Configuration

**Modified: `jest.integration.config.js`**
```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.(ts|js)'],
  testTimeout: 60000, // Reduced from 120000 (per-test timeout)
  maxWorkers: 4, // Run 4 tests in parallel (adjust based on CPU cores)
  globalSetup: '<rootDir>/jest.integration.global-setup.ts',
  globalTeardown: '<rootDir>/jest.integration.global-teardown.ts',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx,js,jsx}',
    '!app/api/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  }
};
```

### Phase 3: Refactor Test Suites

Each test file should be updated to:
1. **Remove its own setup/teardown** (server/db startup)
2. **Use shared instance** at localhost:3000
3. **Clean up test data** between tests (not between suites)

**Example Refactored Test: `api.integration.test.ts`**
```typescript
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

describe('API Integration Tests', () => {
  let mongoClient: MongoClient;
  
  beforeAll(async () => {
    // Connect to existing MongoDB instance
    mongoClient = new MongoClient(process.env.MONGODB_URI!);
    await mongoClient.connect();
  });
  
  afterAll(async () => {
    await mongoClient.close();
  });
  
  beforeEach(async () => {
    // Clean up test data before each test
    const db = mongoClient.db(process.env.MONGODB_DB!);
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  });
  
  it('should return healthy status', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
  
  // ... rest of tests
});
```

### Phase 4: Database Cleanup Strategy

**Critical for parallel tests:** Implement proper data isolation.

**Option A: Clean Between Tests (Safest)**
```typescript
beforeEach(async () => {
  // Clear all collections before each test
  const db = mongoClient.db(process.env.MONGODB_DB!);
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
});
```

**Option B: Use Database Snapshots (Faster)**
```typescript
beforeAll(async () => {
  // Create snapshot of clean database
  await backupDatabase('clean-snapshot');
});

beforeEach(async () => {
  // Restore from snapshot before each test
  await restoreDatabase('clean-snapshot');
});
```

**Option C: Collection-per-Test (Most Isolated)**
```typescript
beforeEach(async () => {
  // Create unique collections with timestamp
  testId = Date.now().toString();
  process.env.MONGODB_DB = `session-combat-test-${testId}`;
});

afterEach(async () => {
  // Drop test-specific database
  await mongoClient.db(`session-combat-test-${testId}`).dropDatabase();
});
```

---

## Performance Expectations

### Before (Sequential, Current)
```
MongoDB startup:        ~3s
Next.js startup:        ~8s
Test 1:                ~5s
Test 2:                ~5s
Test 3:                ~5s
─────────────────────
Total: ~26s (3 sequential suites × ~8s each)
```

### After (Parallel with Shared Instance)
```
MongoDB startup:        ~3s (once)
Next.js startup:        ~8s (once)
Tests 1-4 parallel:     ~5s (max of all)
─────────────────────
Total: ~16s (3x faster!)
```

### Expected Impact
- **Local dev**: 50-70% faster iteration
- **CI/CD**: Shorter PR feedback loops
- **Resource usage**: Lower CPU/memory consumption
- **Scalability**: Can increase `maxWorkers` further with more CPU

---

## Migration Checklist

- [ ] Create `jest.integration.global-setup.ts`
- [ ] Create `jest.integration.global-teardown.ts`
- [ ] Update `jest.integration.config.js` with globalSetup/globalTeardown
- [ ] Refactor `api.integration.test.ts` to remove its own setup
- [ ] Refactor `monsters.integration.test.ts` to remove its own setup
- [ ] Refactor `monsterUploadRoute.test.ts` to use shared instance
- [ ] Refactor `duplicate-monster.test.ts` to use shared instance
- [ ] Refactor `monsters-copy.test.ts` to use shared instance
- [ ] Add database cleanup between tests (beforeEach)
- [ ] Test locally: `npm run test:integration`
- [ ] Verify tests pass in random order: `jest --randomize`
- [ ] Update CI workflow if needed
- [ ] Document parallel test strategy in INTEGRATION_TESTS.md

---

## Handling Test Order Independence

Parallel tests need to be order-independent. Verify with:

```bash
# Run tests in random order multiple times
npm run test:integration -- --randomize --seed=12345
npm run test:integration -- --randomize --seed=67890
npm run test:integration -- --randomize --seed=11111
```

If tests fail randomly, the issue is likely:
1. **Shared state not cleaned** - Add proper `beforeEach`/`afterEach`
2. **Race conditions** - Ensure all operations await promises
3. **Test timeout too short** - Increase for parallel execution

---

## Alternative Approaches

### 1. Docker Compose Setup
Start MongoDB and Next.js via docker-compose before tests:
- ✓ More reproducible
- ✗ Requires Docker setup
- ✗ Less flexibility

### 2. Test Pools by Type
- Run validation tests (no server) separately
- Run server tests in a pool
- More granular control but added complexity

### 3. Hybrid: Parallel Workers + Persistent DB
- Keep single MongoDB for entire CI session
- Clean collections between tests
- Fast but less isolated

---

## Recommended Implementation Order

1. **Start simple**: Update Jest config to support globalSetup
2. **Test feasibility**: Create minimal global setup/teardown
3. **Refactor one suite**: Get one test file working with shared instance
4. **Verify isolation**: Run tests 10+ times in random order
5. **Scale up**: Migrate remaining test suites
6. **Monitor performance**: Track timing before/after
7. **Optimize**: Increase `maxWorkers` based on system resources

---

## References

- [Jest Global Setup/Teardown](https://jestjs.io/docs/configuration#globalsetup-string)
- [Jest maxWorkers](https://jestjs.io/docs/configuration#maxworkers-number--string)
- [Testcontainers Node.js](https://node.testcontainers.org/)
- [Jest Parallel Execution](https://jestjs.io/docs/worker-threads)

