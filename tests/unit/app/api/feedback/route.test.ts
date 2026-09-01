/**
 * @jest-environment node
 */
import { POST } from '@/app/api/feedback/route';
import {
  MOCK_AUTH,
  makeRouteRequest,
  mockAuthState,
} from '@/tests/unit/helpers/route.test.helpers';

jest.mock('@/lib/middleware', () =>
  require('@/tests/unit/helpers/route.test.helpers').createMockMiddleware()
);

jest.mock('@/lib/db/feedbackRateLimit', () => ({
  checkAndIncrementRateLimit: jest.fn(),
}));

jest.mock('@/lib/permissions', () => ({
  getUserById: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendFeedbackEmail: jest.fn(),
}));

import { checkAndIncrementRateLimit } from '@/lib/db/feedbackRateLimit';
import { getUserById } from '@/lib/permissions';
import { sendFeedbackEmail } from '@/lib/email';

const mockedRateLimit = jest.mocked(checkAndIncrementRateLimit);
const mockedGetUserById = jest.mocked(getUserById);
const mockedSendFeedbackEmail = jest.mocked(sendFeedbackEmail);

const VALID_BODY = {
  type: 'bug' as const,
  title: 'Something broke',
  description: 'Details here',
  pageUrl: '/combat',
};

function makeRequest(body: unknown, headers?: Record<string, string>) {
  return makeRouteRequest('http://localhost/api/feedback', 'POST', body, headers);
}

describe('POST /api/feedback', () => {
  let originalFetch: typeof global.fetch;
  const originalTo = process.env.FEEDBACK_TO_EMAIL;
  const originalToken = process.env.MAILTRAP_TOKEN;
  const originalGithub = process.env.GITHUB_FEEDBACK_TOKEN;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    global.fetch = jest.fn() as unknown as typeof fetch;
    mockAuthState.payload = MOCK_AUTH;
    mockedRateLimit.mockResolvedValue({ allowed: true });
    mockedGetUserById.mockResolvedValue({ username: 'testuser' });
    mockedSendFeedbackEmail.mockResolvedValue(undefined);
    process.env.FEEDBACK_TO_EMAIL = 'dnd@dougis.com';
    process.env.MAILTRAP_TOKEN = 'test-token-123';
    delete process.env.GITHUB_FEEDBACK_TOKEN;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    mockAuthState.payload = MOCK_AUTH;
    restoreEnv('FEEDBACK_TO_EMAIL', originalTo);
    restoreEnv('MAILTRAP_TOKEN', originalToken);
    restoreEnv('GITHUB_FEEDBACK_TOKEN', originalGithub);
  });

  function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  it('returns 401 when unauthenticated', async () => {
    mockAuthState.payload = null;
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
  });

  it('returns 429 when rate limit exceeded and sends no email', async () => {
    mockedRateLimit.mockResolvedValue({ allowed: false });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/rate limit/i);
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['an array', []],
    ['a primitive', 42],
  ])('returns 400 when the body is %s', async (_label, body) => {
    const res = await POST(makeRouteRequest('http://localhost/api/feedback', 'POST', body));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is syntactically invalid JSON', async () => {
    const req = new (require('next/server').NextRequest)('http://localhost/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: 'auth-token=t' },
      body: '{ not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
  });

  it('returns 400 when title is empty', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, title: '' }));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it('returns 400 when title exceeds 200 characters', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, title: 'x'.repeat(201) }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when description exceeds 2000 characters', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, description: 'x'.repeat(2001) }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when type is invalid', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, type: 'other' }));
    expect(res.status).toBe(400);
    expect(mockedRateLimit).not.toHaveBeenCalled();
  });

  it('sends a bug feedback email and returns 201 { ok: true }', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });

    expect(mockedSendFeedbackEmail).toHaveBeenCalledTimes(1);
    const arg = mockedSendFeedbackEmail.mock.calls[0][0];
    expect(arg.to).toBe('dnd@dougis.com');
    expect(arg.replyTo).toBe(MOCK_AUTH.email);
    expect(arg.subject).toBe('[Bug] Something broke');
    expect(arg.text).toContain('Details here');
    expect(arg.text).toContain('**Page:** /combat');

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses a [Feature] subject prefix for feature requests', async () => {
    await POST(makeRequest({ ...VALID_BODY, type: 'feature' }));
    expect(mockedSendFeedbackEmail.mock.calls[0][0].subject).toBe('[Feature] Something broke');
  });

  it('truncates the subject to 200 characters', async () => {
    await POST(makeRequest({ ...VALID_BODY, title: 'y'.repeat(200) }));
    expect(mockedSendFeedbackEmail.mock.calls[0][0].subject).toHaveLength(200);
  });

  it('strips markdown/control characters from the subject title', async () => {
    await POST(makeRequest({ ...VALID_BODY, title: 'bad > @ # [x] *_* title' }));
    const subject = mockedSendFeedbackEmail.mock.calls[0][0].subject;
    expect(subject).toMatch(/^\[Bug\] /);
    const titlePart = subject.slice('[Bug] '.length);
    expect(titlePart).not.toMatch(/[\r\n>@#[\]*_]/);
    expect(titlePart).toContain('bad');
    expect(titlePart).toContain('title');
  });

  it('returns 503 when FEEDBACK_TO_EMAIL is not set', async () => {
    delete process.env.FEEDBACK_TO_EMAIL;
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Feedback is not available.' });
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('FEEDBACK_TO_EMAIL'));
    errSpy.mockRestore();
  });

  it('returns 503 when MAILTRAP_TOKEN is not set', async () => {
    delete process.env.MAILTRAP_TOKEN;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
    expect(mockedSendFeedbackEmail).not.toHaveBeenCalled();
  });

  it('returns 502 when sending the feedback email fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedSendFeedbackEmail.mockRejectedValueOnce(new Error('mailtrap down'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({
      error: 'Failed to send feedback. Please try again later.',
    });
  });

  it('recovers on retry after a transient send failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedSendFeedbackEmail.mockRejectedValueOnce(new Error('transient'));
    expect((await POST(makeRequest(VALID_BODY))).status).toBe(502);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
  });

  it.each([
    ['//evil.example', ''],
    ['http://evil.example', ''],
    ['javascript:alert(1)', ''],
    ['https://app.example/combat/abc', 'https://app.example/combat/abc'],
    ['/relative/path', '/relative/path'],
  ])('clamps pageUrl %s in the email body', async (pageUrl, expected) => {
    await POST(makeRequest({ ...VALID_BODY, pageUrl }));
    expect(mockedSendFeedbackEmail.mock.calls[0][0].text).toContain(`**Page:** ${expected}`);
  });

  it('sanitizes the User-Agent header in the email body', async () => {
    await POST(makeRequest(VALID_BODY, { 'user-agent': 'Mozilla/5.0 > @evil # [x] *_*' }));
    const uaLine = mockedSendFeedbackEmail.mock.calls[0][0].text
      .split('\n')
      .find((l: string) => l.startsWith('**User-Agent:**'))!;
    expect(uaLine).toContain('Mozilla/5.0');
    expect(uaLine.slice('**User-Agent:** '.length)).not.toMatch(/[>@#[\]*_]/);
  });

  it('falls back to the email only when the user has no username', async () => {
    mockedGetUserById.mockResolvedValue({});
    await POST(makeRequest(VALID_BODY));
    expect(mockedSendFeedbackEmail.mock.calls[0][0].text).toContain(
      `**Submitted by:** ${MOCK_AUTH.email}`
    );
  });

  it('builds a context-only body when the description is empty', async () => {
    await POST(makeRequest({ ...VALID_BODY, description: '' }));
    const { text } = mockedSendFeedbackEmail.mock.calls[0][0];
    expect(text).not.toContain('---');
  });

  it('never contains the Mailtrap token in the response', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockedSendFeedbackEmail.mockRejectedValueOnce(new Error('boom'));
    const res = await POST(makeRequest(VALID_BODY));
    expect(await res.text()).not.toContain('test-token-123');
  });
});
