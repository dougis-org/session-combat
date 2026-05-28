import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { validateEmail } from '@/lib/auth';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { generateResetToken, hashToken, storeResetToken } from '@/lib/reset-tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { User } from '@/lib/types';

const FORGOT_RATE_LIMIT = 5;
const FORGOT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const GENERIC_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    let email: string | undefined;
    try {
      const body = await request.json();
      email = body?.email;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Trim but do NOT lowercase — register stores emails as-is, so lookup must match exactly
    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const ip = extractIp(request);

    try {
      checkRateLimit(`forgot:ip:${ip}`, FORGOT_RATE_LIMIT, FORGOT_WINDOW_MS);
      checkRateLimit(`forgot:email:${trimmedEmail.toLowerCase()}`, FORGOT_RATE_LIMIT, FORGOT_WINDOW_MS);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');
    const user = await usersCollection.findOne({ email: { $eq: trimmedEmail } });

    // Return generic response immediately — anti-enumeration (D4 + D7)
    const response = NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });

    if (user) {
      const userId = user._id?.toString();
      if (userId) {
        const token = generateResetToken();
        const tokenHash = hashToken(token);
        const resetUrl = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;

        storeResetToken(userId, tokenHash)
          .then(() => sendPasswordResetEmail(trimmedEmail, resetUrl))
          .catch((err) => console.error('Password reset email failed:', err));
      }
    }

    return response;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
