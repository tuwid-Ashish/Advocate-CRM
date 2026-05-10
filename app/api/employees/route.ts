import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;

    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return successResponse({ employees });
  } catch (error: any) {
    console.error('Fetch employees error:', error);
    return errorResponse(error.message || 'Failed to fetch employees', 500);
  }
}
