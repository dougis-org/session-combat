# Parallel Integration Tests - Implementation Examples

This file contains ready-to-use code for implementing parallel integration tests.

## 1. Global Setup Script

**File: `jest.integration.global-setup.ts`**

```typescript
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';

let mongoContainer: StartedMongoDBContainer | null = null;
let nextProcess: ChildProcess | null = null;
const PORT = 3000;
const HEALTH_CHECK_URL = `http://localhost:${PORT}/api/health`;

async function waitForServer(
  url: string,
  maxAttempts: number = 60,
  delay: number = 1000
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url, { timeout: 5000 });
      if (response.ok) {
        return;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(
    `Server did not become ready at ${url} ` +
    `after ${maxAttempts * delay}ms`
  );
}

export default async function globalSetup() {
  try {
    console.log('\n🚀 [Global Setup] Starting integration test environment\n');

    // Start MongoDB Container
    console.log('📦 [MongoDB] Starting container...');
    mongoContainer = await new MongoDBContainer('mongo:8')
      .withExposedPorts(27017)
      .start();

    const mongoUri = mongoContainer.getConnectionString();
    console.log(`✓ [MongoDB] Ready at: ${mongoUri}\n`);

    // Configure environment
    process.env.MONGODB_URI = mongoUri;
    process.env.MONGODB_DB = 'session-combat-test';
    process.env.NODE_ENV = 'production';
    process.env.HOSTNAME = '0.0.0.0';
    process.env.PORT = PORT.toString();

    // Start Next.js Server
    console.log('⚙️  [Next.js] Starting server...');
    nextProcess = spawn('npx', ['next', 'start'], {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    });

    if (!nextProcess.pid) {
      throw new Error('Failed to start Next.js process');
    }

    // Log server output
    nextProcess.stdout?.on('data', (data) => {
      const msg = data.toString().trim();
      if (
        msg.includes('started') ||
        msg.includes('ready') ||
        msg.includes('listening')
      ) {
        console.log(`  [Next.js] ${msg}`);
      }
    });

    nextProcess.stderr?.on('data', (data) => {
      console.error(`  [Next.js Error] ${data.toString().trim()}`);
    });

    // Wait for server to be ready
    console.log('⏳ [Next.js] Waiting for server to be ready...');
    await waitForServer(HEALTH_CHECK_URL, 60, 2000);
    console.log(`✓ [Next.js] Server ready at localhost:${PORT}\n`);

    // Store for global teardown
    (global as any).__MONGO_CONTAINER__ = mongoContainer;
    (global as any).__NEXT_PROCESS__ = nextProcess;
    (global as any).__TEST_BASE_URL__ = `http://localhost:${PORT}`;

  } catch (error) {
    console.error('\n❌ [Global Setup] Failed:', error);
    process.exitCode = 1;

    // Attempt cleanup on failure
    if (nextProcess?.pid) {
      try {
        process.kill(-nextProcess.pid, 'SIGKILL');
      } catch (e) {
        nextProcess.kill('SIGKILL');
      }
    }

    if (mongoContainer) {
      try {
        await mongoContainer.stop();
      } catch (e) {
        console.error('[Global Setup] MongoDB stop error:', e);
      }
    }

    throw error;
  }
}
```

## 2. Global Teardown Script

**File: `jest.integration.global-teardown.ts`**

```typescript
import { StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ChildProcess } from 'child_process';

const SHUTDOWN_TIMEOUT = 10000; // 10 seconds

export default async function globalTeardown() {
  console.log('\n🧹 [Global Teardown] Cleaning up\n');

  const mongoContainer = (global as any)
    .__MONGO_CONTAINER__ as StartedMongoDBContainer | undefined;
  const nextProcess = (global as any)
    .__NEXT_PROCESS__ as ChildProcess | undefined;

  try {
    // Terminate Next.js Server
    if (nextProcess?.pid) {
      console.log(`🛑 [Next.js] Stopping server (PID: ${nextProcess.pid})`);
      try {
        // Try to kill the entire process group first
        process.kill(-nextProcess.pid, 'SIGTERM');
      } catch (err) {
        // Fallback to killing just the process
        nextProcess.kill('SIGTERM');
      }

      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Force kill if still running
      if (!nextProcess.killed) {
        console.log('  [Next.js] Force killing after timeout');
        try {
          process.kill(-nextProcess.pid, 'SIGKILL');
        } catch (err) {
          nextProcess.kill('SIGKILL');
        }
      }
      console.log('✓ [Next.js] Server stopped');
    }

    // Stop MongoDB Container
    if (mongoContainer) {
      console.log('🛑 [MongoDB] Stopping container');
      await Promise.race([
        mongoContainer.stop(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MongoDB stop timeout')), SHUTDOWN_TIMEOUT)
        ),
      ]);
      console.log('✓ [MongoDB] Container stopped');
    }

    console.log('\n✓ [Global Teardown] Complete\n');

  } catch (error) {
    console.error('\n❌ [Global Teardown] Error:', error);
    throw error;
  }
}
```

## 3. Updated Jest Configuration

**File: `jest.integration.config.js`**

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test discovery
  testMatch: ['**/tests/integration/**/*.test.(ts|js)'],

  // Parallel execution
  maxWorkers: 4, // Adjust based on CPU cores
  testTimeout: 60000, // Per-test timeout (reduced from 120s)

  // Global setup/teardown (runs once per Jest session)
  globalSetup: '<rootDir>/jest.integration.global-setup.ts',
  globalTeardown: '<rootDir>/jest.integration.global-teardown.ts',

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx,js,jsx}',
    '!app/api/**/*.d.ts',
  ],

  // TypeScript configuration
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

## 4. Refactored Test Example

**File: `tests/integration/api.integration.test.ts` (Updated)**

```typescript
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';

const BASE_URL = (global as any).__TEST_BASE_URL__ || 'http://localhost:3000';

describe('API Integration Tests', () => {
  let mongoClient: MongoClient;
  let db: any;

  beforeAll(async () => {
    // Connect to existing MongoDB instance
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not set');
    }

    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db(process.env.MONGODB_DB || 'session-combat-test');

    console.log('✓ Test suite connected to shared database');
  });

  afterAll(async () => {
    // Don't close connection - it's shared
    // await mongoClient.close();
    console.log('✓ Test suite disconnected');
  });

  beforeEach(async () => {
    // Clean up test data before each test
    console.log('  [beforeEach] Clearing test collections...');

    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const collName = collection.name;
      // Don't delete system collections
      if (!collName.startsWith('system.')) {
        await db.collection(collName).deleteMany({});
      }
    }
  });

  it('should return healthy status from health endpoint', async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it('should require authentication for protected endpoints', async () => {
    const response = await fetch(`${BASE_URL}/api/characters`);
    expect(response.status).toBe(401);
  });

  it('should allow registration of new users', async () => {
    const email = `test-${Date.now()}@example.com`;
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: 'testPassword123!'
      }),
    });

    // Accept success or expected errors
    expect([201, 409, 500]).toContain(response.status);
  });
});
```

## 5. Validation-Only Test Config (Quick Win)

**File: `jest.validation.config.js`**

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Only validation tests
  testMatch: [
    '**/tests/integration/**(monsterUpload|duplicate-monster|monsters-copy).test.(ts|js)',
  ],

  // Full parallelization - no server needed
  maxWorkers: 4,
  testTimeout: 30000,

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // TypeScript configuration
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

## 6. Updated package.json Scripts

**Relevant section of `package.json`:**

```json
{
  "scripts": {
    "test:validation": "jest --config=jest.validation.config.js",
    "test:server": "jest --config=jest.integration.config.js",
    "test:integration": "npm run test:validation && npm run test:server",
    "test:integration:watch": "jest --config=jest.integration.config.js --watch",
    "test:ci": "npm run test:integration"
  }
}
```

## 7. Helper: Database Cleanup Utility

**File: `tests/integration/utils/db-cleanup.ts`**

```typescript
import { MongoClient, Db } from 'mongodb';

export async function cleanupDatabase(db: Db): Promise<void> {
  const collections = await db.listCollections().toArray();

  for (const collection of collections) {
    const collName = collection.name;

    // Skip system collections
    if (collName.startsWith('system.')) {
      continue;
    }

    await db.collection(collName).deleteMany({});
  }
}

export async function cleanupCollection(
  db: Db,
  collectionName: string
): Promise<void> {
  await db.collection(collectionName).deleteMany({});
}

export async function resetAutoIncrement(
  db: Db,
  counterName: string
): Promise<void> {
  // For MongoDB's auto-increment pattern
  await db.collection('counters').updateOne(
    { _id: counterName },
    { $set: { sequence_value: 0 } },
    { upsert: true }
  );
}
```

## 8. CI/CD Workflow Update

**File: `.github/workflows/integration-tests.yml` (Minimal changes needed)**

```yaml
name: Integration Tests

on:
  push:
    branches: ['main']
  pull_request:
    branches: ['main']

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Run validation tests (parallel)
        run: npm run test:validation

      - name: Run integration tests (parallel with shared instance)
        run: npm run test:server

      - name: Upload artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: |
            coverage/
            test-results/
          retention-days: 7
```

---

## Implementation Checklist

- [ ] Copy `jest.integration.global-setup.ts` to root
- [ ] Copy `jest.integration.global-teardown.ts` to root
- [ ] Create `jest.validation.config.js` in root
- [ ] Update `jest.integration.config.js` (add globalSetup/Teardown)
- [ ] Update `package.json` with new test scripts
- [ ] Refactor `tests/integration/api.integration.test.ts`
- [ ] Refactor `tests/integration/monsters.integration.test.ts`
- [ ] Create `tests/integration/utils/db-cleanup.ts`
- [ ] Test locally: `npm run test:validation`
- [ ] Test locally: `npm run test:server`
- [ ] Test with random order: `npm run test:server -- --randomize`
- [ ] Update CI workflow (optional - minimal changes)

