import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { checkAndIncrementRateLimit } from '@/lib/db/feedbackRateLimit';
import { getUserById } from '@/lib/permissions';
import { extractIp } from '@/lib/utils/http';
import { sendFeedbackEmail } from '@/lib/email';
import { validateFeedbackInput } from '@/lib/validation/feedback';

function sanitizePlainText(value: string, maxLen = 200): string {
  return value
    .replace(/[\r\n]/g, ' ')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .replace(/[[\]*_`>@#]/g, '')
    .trim()
    .slice(0, maxLen);
}

function buildFeedbackBody(
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
  const parsed = await request.json().catch(() => null);
  const validation = validateFeedbackInput(parsed);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const { type, title, description, pageUrl } = validation.value;

  const ip = extractIp(request);
  const { allowed } = await checkAndIncrementRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait before submitting again.' },
      { status: 429 }
    );
  }

  const to = process.env.FEEDBACK_TO_EMAIL;
  if (!to || !process.env.MAILTRAP_TOKEN) {
    console.error(
      `Feedback email is not configured: ${!to ? 'FEEDBACK_TO_EMAIL' : 'MAILTRAP_TOKEN'} is not set`
    );
    return NextResponse.json({ error: 'Feedback is not available.' }, { status: 503 });
  }

  const user = await getUserById(auth.userId);
  const githubHandle = user?.['username'] as string | undefined;
  const email = auth.email;
  const submittedBy = githubHandle ? `@${githubHandle} (${email})` : email;
  const userAgent = sanitizePlainText(request.headers.get('user-agent') ?? '');
  const descriptionStr = sanitizePlainText(description, 2000);

  const subjectPrefix = type === 'bug' ? '[Bug] ' : '[Feature] ';
  const subject = (subjectPrefix + sanitizePlainText(title, 200)).slice(0, 200);
  const text = buildFeedbackBody(submittedBy, pageUrl, userAgent, descriptionStr);

  try {
    await sendFeedbackEmail({ to, replyTo: email, subject, text });
  } catch (err) {
    console.error('Feedback email send failed:', err);
    return NextResponse.json(
      { error: 'Failed to send feedback. Please try again later.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
