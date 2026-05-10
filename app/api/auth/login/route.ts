/**
 * Login API Route
 * POST /api/auth/login
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createSessionResponse } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/middleware';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return errorResponse('Missing required fields: email, password', 400);
    }

    // Find employee
    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!employee) {
      return errorResponse('Invalid email or password', 401);
    }

    if (!employee.active) {
      return errorResponse('Employee account is inactive', 403);
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, employee.password);

    if (!passwordMatch) {
      return errorResponse('Invalid email or password', 401);
    }

    // Create session
    const session = createSessionResponse(employee);

    return successResponse(
      {
        message: 'Login successful',
        ...session,
      },
      200
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
}
