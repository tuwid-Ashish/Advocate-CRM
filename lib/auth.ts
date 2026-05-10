/**
 * Authentication utilities
 * Handles JWT tokens, password hashing, and session management
 */

import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '24h';

/**
 * Hash password using bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

/**
 * Compare password with hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

/**
 * Create JWT token
 */
export function createToken(payload: any, expiresIn: string = JWT_EXPIRY): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

/**
 * Create session response
 */
export function createSessionResponse(user: any) {
  const token = createToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
