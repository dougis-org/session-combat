import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { checkAndIncrementRateLimit } from '@/lib/db/feedbackRateLimit';
import { getUserById } from '@/lib/permissions';
import { extractIp } from '@/lib/utils/http';

function buildIssueBody(
  submittedBy: string,
  pageUrl: string,
  userAgent: string,
  description: string
): string {
  const context = [
    `**Submitted by:** ${submittedBy}`,
    `**Page:** ${pageUrl}`,
    `**User-Agent:** ${userAgent}`,
  ].join('\n');

  return description.trim()
    ? `${context}\n\n---\n\n${description}`
    : context;
}

export const POST = withAuth(async (request: NextRequest, auth) => {
  const ip = extractIp(request);
  const { allowed } = await checkAndIncrementRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before submitting again.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, title, description, pageUrl } = body as Record<string, unknown>;

  if (type !== 'bug' && type !== 'feature') {
    return NextResponse.json({ error: 'type must be "bug" or "feature"' }, { status: 400 });
  }
  if (typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }
  if (title.trim().length > 200) {
    return NextResponse.json({ error: 'title must be 200 characters or fewer' }, { status: 400 });
  }
  if (typeof description === 'string' && description.length > 2000) {
    return NextResponse.json({ error: 'description must be 2000 characters or fewer' }, { status: 400 });
  }

  const githubToken = process.env.GITHUB_FEEDBACK_TOKEN;
  if (!githubToken) {
    console.error('GITHUB_FEEDBACK_TOKEN is not configured');
    return NextResponse.json({ error: 'Feedback is not available.' }, { status: 503 });
  }

  const user = await getUserById(auth.userId);
  const githubHandle = user?.['username'] as string | undefined;
  const email = auth.email;
  const submittedBy = githubHandle ? `@${githubHandle} (${email})` : email;
  const userAgent = request.headers.get('user-agent') ?? '';
  const rawPageUrl = typeof pageUrl === 'string' ? pageUrl.replace(/[\r\n]/g, '') : '';
  const pageUrlStr = (rawPageUrl.startsWith('https://') || (rawPageUrl.startsWith('/') && !rawPageUrl.startsWith('//'))) ? rawPageUrl : '';
  const descriptionStr = typeof description === 'string' ? description : '';

  const issueBody = buildIssueBody(submittedBy, pageUrlStr, userAgent, descriptionStr);
  const labels = type === 'bug' ? ['bug'] : ['enhancement'];

  const githubResponse = await fetch(
    'https://api.github.com/repos/dougis-org/session-combat/issues',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ title: title.trim(), body: issueBody, labels }),
    }
  );

  if (!githubResponse.ok) {
    const errorText = await githubResponse.text().catch(() => '');
    console.error('GitHub API error:', githubResponse.status, errorText);
    return NextResponse.json(
      { error: 'Failed to create feedback issue. Please try again later.' },
      { status: 502 }
    );
  }

  const issue = await githubResponse.json() as { html_url: string };
  return NextResponse.json({ issueUrl: issue.html_url }, { status: 201 });
});
