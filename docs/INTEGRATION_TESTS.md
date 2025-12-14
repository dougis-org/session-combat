# Integration Tests with Testcontainers

This guide covers how to write and run integration tests using Testcontainers for Node.js and Next.js in the session-combat project.

## Overview

**Testcontainers** is a library that provides lightweight, throwaway instances of databases, message brokers, web browsers, or anything else that can run in a Docker container. This allows us to write integration tests that interact with real dependencies rather than mocks.

## Why Testcontainers?

- **Real Behavior**: Tests run against actual databases/services, not mocks
- **Isolation**: Each test run gets fresh containers, preventing test pollution
- **CI/CD Friendly**: Works seamlessly in GitHub Actions and other CI environments
- **Easy Setup**: Minimal configuration required
- **Reproducible**: Same container images locally and in CI

## Prerequisites

- **Docker**: Must be installed and running on your local machine
- **Node.js**: Version 16 or higher
- **Dependencies**: Install with `npm ci`

## Running Integration Tests Locally

1. **Ensure Docker is running:**
   ```bash
   docker ps
   ```

2. **Install dependencies:**
   ```bash
   npm ci
   ```

3. **Build the Next.js application:**
   ```bash
   npm run build
   ```
   Integration tests require a production build to test the compiled application.

4. **Run integration tests:**
   ```bash
   npm run test:integration
   ```

## Writing Integration Tests

### Example: Testing a Postgres-backed API Route

Our integration tests follow this pattern:

1. **Start Testcontainers** (e.g., Postgres)
2. **Configure environment variables** with connection details from the container
3. **Start the Next.js server** in production mode
4. **Wait for the server to be ready** using the health endpoint
5. **Make HTTP requests** to test API routes
6. **Assert on responses**
7. **Clean up** containers and processes

See `tests/integration/api.integration.test.ts` for a complete example.

### Key Components

#### Health Check Endpoint
The `/api/health` endpoint is used to verify the Next.js server is ready:
```typescript
// pages/api/health.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ok: true });
}
```

#### Database Connection
API routes read Postgres connection info from environment variables:
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

The `pg` library's `Pool` is reused across hot module reloads to avoid connection leaks.

#### Test Structure
```typescript
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';

describe('API Integration Tests', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let nextProcess: ChildProcess;
  
  beforeAll(async () => {
    // Start Postgres container
    postgresContainer = await new PostgreSqlContainer().start();
    
    // Set environment variables
    process.env.PGHOST = postgresContainer.getHost();
    // ...
    
    // Start Next.js server
    nextProcess = spawn('npm', ['run', 'start'], { env: process.env });
    
    // Wait for server to be ready
    await waitForServer('http://localhost:3000/api/health');
  }, 120000);
  
  afterAll(async () => {
    // Clean up
    nextProcess?.kill();
    await postgresContainer?.stop();
  });
  
  it('should interact with database', async () => {
    // Test your API routes
  });
});
```

## Configuration

Integration tests use a separate Jest configuration file: `jest.integration.config.js`

Key settings:
- `testEnvironment: 'node'` - Run in Node.js environment
- `testMatch: '**/tests/integration/**/*.test.(ts|js)'` - Only integration tests
- `testTimeout: 120000` - Increased timeout for container startup

## Running in CI

Integration tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to any branch

See `.github/workflows/integration-tests.yml` for the workflow configuration.

The workflow:
1. Checks out code
2. Sets up Node.js
3. Installs dependencies
4. Builds the application
5. Runs integration tests
6. Uploads test artifacts on failure

## When to Use Mocks Instead

While we prefer integration tests, mocks are appropriate for:
- **Pure business logic** without external dependencies
- **Third-party APIs** that cannot be containerized (no local equivalent)
- **Performance-critical unit tests** that need to run in milliseconds
- **Error conditions** that are difficult to reproduce with real dependencies
- **UI component testing** in isolation

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check Docker permissions: `docker ps` should work without sudo

### "Port already in use"
- Testcontainers automatically maps to random available ports
- If Next.js port 3000 is in use, stop other Next.js instances

### Tests timeout
- Increase `testTimeout` in jest.integration.config.js
- Check Docker resources (CPU/memory) in Docker Desktop settings
- Ensure your machine has sufficient resources

### Container cleanup issues
- Manually remove containers: `docker ps -a` and `docker rm <container_id>`
- Testcontainers uses Ryuk for automatic cleanup

## Resources

- [Testcontainers Node.js Documentation](https://node.testcontainers.org/)
- [Testcontainers Postgres Module](https://node.testcontainers.org/modules/postgresql/)
- [Jest Documentation](https://jestjs.io/)
- [Next.js API Routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes)

## Examples in This Repository

- `tests/integration/api.integration.test.ts` - Complete integration test example
- `pages/api/items.ts` - Example API route with Postgres integration
- `pages/api/health.ts` - Health check endpoint for readiness probes
