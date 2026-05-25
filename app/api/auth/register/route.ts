/**
 * Authentication API Routes
 * POST /api/auth/register - Register a new employee
 * POST /api/auth/login - Login employee
 * POST /api/auth/logout - Logout (client-side only, for token clearing)
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionResponse } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/middleware';


/**
 * POST /api/auth/register
 * Register a new employee (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return errorResponse('Missing required fields: name, email, password', 400);
    }

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters', 400);
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      return errorResponse('Employee with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        active: true,
      },
    });

    // Create session
    const session = createSessionResponse(employee);
    const response = successResponse(
      {
        message: 'Employee registered successfully',
        ...session,
      },
      201
    );

    response.cookies.set('token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed', 500);
  }
}
