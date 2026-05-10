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
  const token = getTokenFromHeader(authHeader);

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
      return errorResponse(error.message || 'Internal server error', 500);
    }
  };
}
