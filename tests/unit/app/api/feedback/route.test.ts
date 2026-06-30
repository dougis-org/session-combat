/**
 * @jest-environment node
 */
import { POST } from '@/app/api/feedback/route';
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
} from '@/tests/unit/helpers/route.test.helpers';
import { Response as FetchResponse } from 'node-fetch';

jest.mock('@/lib/middleware', () =>
  require('@/tests/unit/helpers/route.test.helpers').createMockMiddleware()
);

jest.mock('@/lib/db/feedbackRateLimit', () => ({
  checkAndIncrementRateLimit: jest.fn(),
}));

jest.mock('@/lib/permissions', () => ({
  getUserById: jest.fn(),
}));

import { checkAndIncrementRateLimit } from '@/lib/db/feedbackRateLimit';
import { getUserById } from '@/lib/permissions';

const mockedRateLimit = jest.mocked(checkAndIncrementRateLimit);
const mockedGetUserById = jest.mocked(getUserById);

const VALID_BODY = {
  type: 'bug' as const,
  title: 'Something broke',
  description: 'Details here',
  pageUrl: '/combat',
};

function makeRequest(body: unknown) {
  return makeRouteRequest('http://localhost/api/feedback', 'POST', body);
}

function mockFetchSuccess(issueUrl = 'https://github.com/issues/1') {
  global.fetch = jest.fn(() =>
    Promise.resolve(
      new FetchResponse(JSON.stringify({ html_url: issueUrl }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as Response
    )
  ) as unknown as jest.MockedFunction<typeof fetch>;
}

function mockFetchFailure(status = 500) {
  global.fetch = jest.fn(() =>
    Promise.resolve(
      new FetchResponse(JSON.stringify({ message: 'GitHub error' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }) as unknown as Response
    )
  ) as unknown as jest.MockedFunction<typeof fetch>;
}

describe('POST /api/feedback', () => {
  let originalFetch: typeof global.fetch;
  const originalToken = process.env.GITHUB_FEEDBACK_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    mockAuthState.payload = MOCK_AUTH;
    mockedRateLimit.mockResolvedValue({ allowed: true });
    mockedGetUserById.mockResolvedValue({ username: 'testuser' });
    process.env.GITHUB_FEEDBACK_TOKEN = 'test-token-123';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mockAuthState.payload = MOCK_AUTH;
    if (originalToken === undefined) {
      delete process.env.GITHUB_FEEDBACK_TOKEN;
    } else {
      process.env.GITHUB_FEEDBACK_TOKEN = originalToken;
    }
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuthState.payload = null;
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/rate limit/i);
  });

  it('returns 400 when title is empty', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, title: '' }));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it('returns 400 when type is invalid', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, type: 'other' }));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it('creates GitHub issue for bug report and returns 201', async () => {
    mockFetchSuccess();
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    const body = await res.json() as { issueUrl: string };
    expect(body.issueUrl).toBe('https://github.com/issues/1');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/dougis-org/session-combat/issues',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-123',
        }),
        body: expect.stringContaining('"bug"'),
      })
    );
    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(callBody.labels).toContain('bug');
    expect(callBody.title).toBe('Something broke');
    expect(callBody.body).toContain('/combat');
  });

  it('creates GitHub issue for feature request with label enhancement', async () => {
    mockFetchSuccess();
    const res = await POST(makeRequest({ ...VALID_BODY, type: 'feature' }));
    expect(res.status).toBe(201);
    const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(callBody.labels).toContain('enhancement');
  });

  it('returns 502 on GitHub API failure', async () => {
    mockFetchFailure(500);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(502);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/failed to create/i);
  });

  it('returns 503 when GITHUB_FEEDBACK_TOKEN is not set', async () => {
    delete process.env.GITHUB_FEEDBACK_TOKEN;
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it('response body does not contain token value', async () => {
    mockFetchFailure(500);
    const res = await POST(makeRequest(VALID_BODY));
    const text = await res.text();
    expect(text).not.toContain('test-token-123');
  });
});
