import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ChildProcess, spawn } from 'child_process';
import fetch from 'node-fetch';

describe('API Integration Tests', () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let nextProcess: ChildProcess;
  const baseUrl = 'http://localhost:3000';

  // Helper function to wait for the server to be ready
  async function waitForServer(url: string, maxAttempts = 30, delay = 2000): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return;
        }
      } catch (error) {
        // Server not ready yet, continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Server did not become ready at ${url} after ${maxAttempts} attempts`);
  }

  beforeAll(async () => {
    console.log('Starting Postgres container...');
    postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withExposedPorts(5432)
      .start();

    console.log('Postgres container started');

    // Set environment variables for the Next.js server
    process.env.PGHOST = postgresContainer.getHost();
    process.env.PGPORT = postgresContainer.getPort().toString();
    process.env.PGUSER = postgresContainer.getUsername();
    process.env.PGPASSWORD = postgresContainer.getPassword();
    process.env.PGDATABASE = postgresContainer.getDatabase();

    console.log('Starting Next.js server...');
    nextProcess = spawn('npm', ['run', 'start'], {
      env: { ...process.env },
      stdio: 'pipe',
    });

    // Log Next.js output for debugging
    nextProcess.stdout?.on('data', (data) => {
      console.log(`Next.js: ${data.toString()}`);
    });

    nextProcess.stderr?.on('data', (data) => {
      console.error(`Next.js Error: ${data.toString()}`);
    });

    // Wait for the Next.js server to be ready
    console.log('Waiting for Next.js server to be ready...');
    await waitForServer(`${baseUrl}/api/health`);
    console.log('Next.js server is ready');
  }, 120000);

  afterAll(async () => {
    console.log('Cleaning up...');
    
    if (nextProcess) {
      nextProcess.kill('SIGTERM');
      // Give the process time to terminate gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (postgresContainer) {
      await postgresContainer.stop();
    }
    
    console.log('Cleanup complete');
  }, 30000);

  it('should return healthy status from health endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it('should POST an item and then GET it back', async () => {
    // POST a new item
    const postResponse = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Item' }),
    });

    expect(postResponse.status).toBe(201);
    const postData: any = await postResponse.json();
    expect(postData.item).toBeDefined();
    expect(postData.item.name).toBe('Test Item');
    expect(postData.item.id).toBeDefined();

    const itemId = postData.item.id;

    // GET all items
    const getResponse = await fetch(`${baseUrl}/api/items`);
    expect(getResponse.status).toBe(200);
    
    const getData: any = await getResponse.json();
    expect(getData.items).toBeDefined();
    expect(Array.isArray(getData.items)).toBe(true);
    
    // Find our item
    const foundItem = getData.items.find((item: any) => item.id === itemId);
    expect(foundItem).toBeDefined();
    expect(foundItem.name).toBe('Test Item');
  });

  it('should return 400 for POST without name', async () => {
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    const data: any = await response.json();
    expect(data.error).toBe('Name is required');
  });

  it('should return 405 for unsupported methods', async () => {
    const response = await fetch(`${baseUrl}/api/items`, {
      method: 'DELETE',
    });

    expect(response.status).toBe(405);
    const data: any = await response.json();
    expect(data.error).toBe('Method not allowed');
  });
});
