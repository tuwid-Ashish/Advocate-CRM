/**
 * Authentication middleware for API routes
 * Validates JWT token and attaches user info to request
 */

import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'EMPLOYEE';
  };
}

/**
 * Middleware to authenticate requests
 * Usage: await authenticateRequest(request)
 */
export function authenticateRequest(request: NextRequest): AuthenticatedRequest {
  const authHeader = request.headers.get('authorization');
  const headerToken = getTokenFromHeader(authHeader);
  const cookieToken = request.cookies.get('token')?.value;
  const token = headerToken || cookieToken;

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const decoded = verifyToken(token);
    (request as AuthenticatedRequest).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    return request as AuthenticatedRequest;
  } catch (error) {
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(userRole: string, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

/**
 * Helper to create error response
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isPrismaError(error: any): boolean {
  if (!error) return false;
  if (typeof error.name === 'string' && error.name.startsWith('Prisma')) return true;
  if (typeof error.message === 'string' && error.message.includes('prisma.')) return true;
  if (typeof error.message === 'string' && error.message.includes('Invalid `prisma')) return true;
  return false;
}

export function sanitizeErrorMessage(error: any, fallback: string): string {
  if (isPrismaError(error)) return fallback;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function errorResponseFromException(
  error: any,
  fallback: string,
  status: number = 500
) {
  return errorResponse(sanitizeErrorMessage(error, fallback), status);
}

/**
 * Helper to create success response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Middleware function for API routes
 * Wraps handler with auth logic
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  requiredRole?: string | string[]
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authenticatedReq = authenticateRequest(request);

      if (requiredRole && !requireRole(authenticatedReq.user!.role, requiredRole)) {
        return errorResponse('Insufficient permissions', 403);
      }

      return await handler(authenticatedReq);
    } catch (error: any) {
      if (error.message.includes('token')) {
        return errorResponse('Unauthorized', 401);
      }
      return errorResponseFromException(error, 'Internal server error', 500);
    }
  };
}
