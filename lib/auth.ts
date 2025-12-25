import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthPayload } from './types';
import { validatePasswordForClient } from './validation/password';

export type { AuthPayload };

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_EXPIRE = '7d';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength (server-side wrapper using shared validator)
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  // Reuse client-safe validator to keep rules consistent without pulling in heavy deps
  return validatePasswordForClient(password);
}
