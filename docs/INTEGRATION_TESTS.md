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
- **Node.js**: Version 18 or higher
- **Dependencies**: Install with `npm ci`

## Running Tests Locally

### Unit tests (with coverage)
```bash
npm run test:unit
```

### Integration tests (requires Docker + a prior production build)
```bash
npm run build
npm run test:integration
```

### Integration tests in CI mode (with `--forceExit`)
```bash
npm run test:ci
```

> **Why two integration scripts?**
> `test:integration` runs cleanly without `--forceExit` so open handles surface during development.
> `test:ci` adds `--forceExit` to prevent CI job hangs caused by lingering MongoDB/HTTP handles after tests complete.
> The pre-commit hook uses `test:ci`.

### E2E tests (requires Docker + a prior production build)
```bash
npm run build
npm run test:e2e
```

## Writing Integration Tests

### Test structure

Each integration test suite follows this pattern:

1. **Start a test server** (MongoDB container + Next.js process) via `startTestServer()`
2. **Make HTTP requests** to the running server
3. **Assert on responses**
4. **Clean up** in `afterAll`

```typescript
import { startTestServer, TestServer } from "@/tests/integration/helpers/server";
import {
  registerUser,
  assertSuccessResponse,
  assertErrorResponse,
  VALID_PASSWORD,
} from "@/tests/integration/auth.test.helpers";

describe("POST /api/auth/register", () => {
  let server: TestServer;
  let baseUrl: string;

  beforeAll(async () => {
    server = await startTestServer();
    baseUrl = server.baseUrl;
  }, 120000);

  afterAll(async () => {
    await server.cleanup();
  }, 30000);

  it("should register a new user", async () => {
    const response = await registerUser(baseUrl, "user@example.com", VALID_PASSWORD);
    const data = await assertSuccessResponse<{ userId: string; email: string }>(response, 201);
    expect(data.userId).toBeDefined();
  });

  it("should return 409 on duplicate email", async () => {
    await registerUser(baseUrl, "dup@example.com", VALID_PASSWORD);
    const response = await registerUser(baseUrl, "dup@example.com", VALID_PASSWORD);
    await assertErrorResponse(response, 409);
  });
});
```

### Key helpers

#### `tests/integration/helpers/server.ts`

- `startTestServer()` — spins up a MongoDB Testcontainer and a Next.js production server on a random port. Returns `{ baseUrl, cleanup }`.
- `registerAndGetCookie(baseUrl, email, password)` — registers a user and returns the `Cookie` header string, ready to pass as `Cookie:` in subsequent requests.

#### `tests/integration/auth.test.helpers.ts`

Common auth flows and assertion helpers:

| Helper | Purpose |
|--------|---------|
| `registerUser(baseUrl, email, password)` | POST `/api/auth/register` |
| `loginUser(baseUrl, email, password)` | POST `/api/auth/login` |
| `logoutUser(baseUrl, cookie?)` | POST `/api/auth/logout` |
| `registerAndLogin(baseUrl, email, password)` | Both in sequence |
| `assertSuccessResponse(response, status)` | Assert status + parse JSON |
| `assertErrorResponse(response, status)` | Assert error status + parse JSON |
| `extractAuthCookie(response)` | Extract `auth-token=...` from `Set-Cookie` |
| `createTestEmail(prefix)` | Unique timestamped email |
| `createTestUser(prefix)` | `{ email, password }` pair |
| `VALID_PASSWORD`, `WEAK_PASSWORDS`, `INVALID_EMAILS` | Test data constants |

### Important: dynamic imports for database access

If a test needs to query MongoDB directly (e.g., to verify a stored hash), use a **dynamic import** inside the test function rather than a top-level static import:

```typescript
// ✅ Correct: dynamic import defers module load until after beforeAll sets MONGODB_URI
const { getDatabase, closeDatabase } = await import("@/lib/db");
const db = await getDatabase();
const user = await db.collection("users").findOne({ email });
await closeDatabase(); // prevent leaked handles
```

A static `import { getDatabase } from "@/lib/db"` at the top of the file evaluates `MONGODB_URI` at module-load time — **before** `beforeAll` runs — and will connect to the wrong (or no) database.

## Coverage

Integration tests produce coverage via:

```bash
npm run test:ci -- --coverage
```

Coverage reports are written to `coverage/` and uploaded to Codacy in CI (`build-test.yml`).

**Why doesn't Jest count HTTP-driven integration tests in unit coverage?**
Jest only tracks coverage for modules that are `import`ed directly into the test process. When integration tests hit a running Next.js server over HTTP, the route handler runs in a separate subprocess — Jest cannot instrument it. This is expected and correct. For route-level coverage, use direct unit tests that `import { POST } from "@/app/api/.../route"` with mocked dependencies.

## Configuration

Integration tests use `jest.integration.config.js`. Key settings:

- `testEnvironment: 'node'`
- `testMatch: '**/tests/integration/**/*.test.(ts|js)'`
- `testTimeout: 120000` — allows time for container + Next.js startup

## Running in CI

Integration tests run in GitHub Actions on all PRs and pushes via `.github/workflows/build-test.yml`.

The workflow:
1. Checks out code
2. Sets up Node.js
3. Installs dependencies
4. Builds the application
5. Runs unit tests with coverage
6. Runs integration tests with coverage (`npm run test:ci -- --coverage --forceExit`)
7. Uploads LCOV to Codacy

## When to Use Mocks Instead

While we prefer integration tests for API routes, mocks are appropriate for:
- **Pure business logic** without external dependencies
- **Third-party APIs** that cannot be containerized
- **Performance-critical unit tests** that need to run in milliseconds
- **Error conditions** difficult to reproduce with real services
- **UI component testing** in isolation

See `CONTRIBUTING.md` for reviewer expectations on integration vs. mock trade-offs.

## Troubleshooting

### "Cannot connect to Docker daemon"
- Ensure Docker Desktop is running
- Check: `docker ps` should work without sudo

### "Port already in use"
- `startTestServer()` uses `findAvailablePort()` to pick a random free port; Next.js conflicts are rare
- Stop any other running `next start` instances if you see this

### Tests time out
- Increase `testTimeout` in `jest.integration.config.js` (default: 120 000 ms)
- Check Docker resource limits in Docker Desktop settings

### Integration tests hang after completion
- Use `npm run test:ci` (adds `--forceExit`) to force cleanup of lingering handles
- Avoid open database connections in test code without calling `closeDatabase()`

### Container cleanup issues
- List containers: `docker ps -a`
- Remove stale containers: `docker rm <container_id>`
- Testcontainers uses Ryuk for automatic cleanup

## Resources

- [Testcontainers Node.js Documentation](https://node.testcontainers.org/)
- [Testcontainers MongoDB Module](https://node.testcontainers.org/modules/mongodb/)
- [Jest Documentation](https://jestjs.io/)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
