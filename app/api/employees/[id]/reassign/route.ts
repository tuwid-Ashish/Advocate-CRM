export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest } from 'next/server';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';
import { reassignEmployeeAccount } from '@/lib/employeeAssignment';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;

    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const { newAssignedName, notes } = body;

    if (!newAssignedName || !newAssignedName.trim()) {
      return errorResponse('Missing required field: newAssignedName', 400);
    }

    const updatedEmployee = await reassignEmployeeAccount(
      employeeId,
      newAssignedName.trim(),
      notes
    );

    return successResponse({
      message: 'Employee reassigned successfully',
      employee: updatedEmployee,
    });
  } catch (error: any) {
    console.error('Reassign employee error:', error);
    return errorResponse(error.message || 'Failed to reassign employee', 500);
  }
}
