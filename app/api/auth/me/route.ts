/**
 * Session info API Route
 * GET /api/auth/me
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { errorResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const decoded = verifyToken(token);
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!employee || !employee.active) {
      return errorResponse('Unauthorized', 401);
    }

    return NextResponse.json({
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    return errorResponse('Unauthorized', 401);
  }
}
