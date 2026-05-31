import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { 
  hashPassword, 
  generateToken, 
  validateEmail, 
  validatePassword 
} from '@/lib/auth';
import { setAuthCookie } from '@/lib/middleware';
import { User } from '@/lib/types';
import { validateUsername } from '@/lib/validation/username';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    // Validate input
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password and username are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { error: 'Username does not meet requirements', details: usernameValidation.errors },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const newUser: User = {
      email,
      username,
      passwordHash,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let result;
    try {
      result = await usersCollection.insertOne(newUser);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        const mongoErr = err as { code: number; keyPattern?: Record<string, unknown> };
        if (mongoErr.keyPattern?.username) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 409 }
          );
        }
        if (mongoErr.keyPattern?.email) {
          return NextResponse.json(
            { error: 'User with this email already exists' },
            { status: 409 }
          );
        }
      }
      throw err;
    }
    
    const userId = result.insertedId.toString();

    // Generate token
    const token = generateToken({ userId, email, tokenVersion: 0 });

    // Create response with cookie
    const response = NextResponse.json(
      { userId, email, username, message: 'User registered successfully' },
      { status: 201 }
    );
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
