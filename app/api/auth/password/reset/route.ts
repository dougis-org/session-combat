import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { validateResetToken, hashToken, consumeResetToken } from '@/lib/reset-tokens';
import { User } from '@/lib/types';

const RESET_RATE_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';

    try {
      checkRateLimit(`reset:ip:${ip}`, RESET_RATE_LIMIT, RESET_WINDOW_MS);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }

    let userId: string;
    try {
      userId = await validateResetToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements.', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const tokenHash = hashToken(token);

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    // Atomically update passwordHash and increment tokenVersion — invalidates all existing sessions (D-A2)
    const result = await usersCollection.updateOne(
      { _id: userObjectId as unknown as User['_id'] },
      {
        $set: { passwordHash, updatedAt: new Date() },
        $inc: { tokenVersion: 1 },
      }
    );

    if (result.matchedCount === 0) {
      console.error(`Password reset: user not found for userId=${userId}`);
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    // Only consume the token after the password update succeeded to avoid burning a token without effect
    await consumeResetToken(tokenHash);

    return NextResponse.json({ message: 'Password reset successful.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
