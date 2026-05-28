import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/db';
import { hashPassword, validatePassword } from '@/lib/auth';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';
import { hashToken, ResetTokenDocument } from '@/lib/reset-tokens';
import { User } from '@/lib/types';

const RESET_RATE_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    let token: string | undefined;
    let password: string | undefined;
    try {
      const body = await request.json();
      token = body?.token;
      password = body?.password;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const ip = extractIp(request);

    try {
      checkRateLimit(`reset:ip:${ip}`, RESET_RATE_LIMIT, RESET_WINDOW_MS);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements.', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const now = new Date();

    // Always hash the password and atomically claim the token in parallel — prevents timing
    // oracle between valid and invalid token paths (both paths pay the bcrypt cost before returning)
    const db = await getDatabase();
    const tokensCol = db.collection<ResetTokenDocument>('password_reset_tokens');

    const [passwordHash, tokenDoc] = await Promise.all([
      hashPassword(password),
      tokensCol.findOneAndUpdate(
        { tokenHash: { $eq: tokenHash }, consumedAt: { $exists: false }, expiresAt: { $gt: now } },
        { $set: { consumedAt: now } },
        { returnDocument: 'before' }
      ),
    ]);

    if (!tokenDoc) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    const { userId } = tokenDoc;
    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch {
      // Corrupt token data — restore consumedAt so the token isn't silently burned
      await tokensCol.updateOne({ tokenHash: { $eq: tokenHash } }, { $unset: { consumedAt: '' } });
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

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
      // User deleted after token issued — restore token so it isn't silently burned without effect
      await tokensCol.updateOne({ tokenHash: { $eq: tokenHash } }, { $unset: { consumedAt: '' } });
      console.error(`Password reset: user not found for userId=${userId}`);
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successful.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
