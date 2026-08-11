import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';
import { ensureEmployeeAssignments } from '@/lib/employeeAssignment';

export async function GET(request: NextRequest) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;

    if (user.role !== 'ADMIN') {
      return errorResponse('Forbidden: Admin access required', 403);
    }

    await ensureEmployeeAssignments();

    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        assignments: {
          orderBy: { startDate: 'desc' },
        },
        createdRecords: {
          select: {
            id: true,
            assignmentId: true,
            createdAt: true,
            paymentStatus: true,
            payment: {
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedEmployees = employees.map((emp) => {
      // Format assignments with metrics
      const formattedAssignments = emp.assignments.map((assignment) => {
        // Records linked directly by assignmentId or fallback by creator + assignment date range
        const assignmentRecords = emp.createdRecords.filter((rec) => {
          if (rec.assignmentId) {
            return rec.assignmentId === assignment.id;
          }
          const recDate = new Date(rec.createdAt);
          const start = new Date(assignment.startDate);
          const end = assignment.endDate ? new Date(assignment.endDate) : new Date();
          return recDate >= start && recDate <= end;
        });

        const count = assignmentRecords.length;
        const revenue = assignmentRecords.reduce((sum, r) => sum + Number(r.payment?.amount || 0), 0);

        return {
          id: assignment.id,
          assignedName: assignment.assignedName,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          isCurrent: assignment.isCurrent,
          notes: assignment.notes,
          count,
          revenue,
        };
      });

      const activeAssignmentData = formattedAssignments.find((a) => a.isCurrent) || formattedAssignments[0];

      const totalCount = emp.createdRecords.length;
      const totalRevenue = emp.createdRecords.reduce((sum, r) => sum + Number(r.payment?.amount || 0), 0);

      return {
        id: emp.id,
        name: activeAssignmentData ? activeAssignmentData.assignedName : emp.name,
        accountEmail: emp.email,
        role: emp.role,
        active: emp.active,
        createdAt: emp.createdAt,
        currentAssignment: activeAssignmentData ? {
          id: activeAssignmentData.id,
          assignedName: activeAssignmentData.assignedName,
          startDate: activeAssignmentData.startDate,
          notes: activeAssignmentData.notes,
        } : null,
        activeMetrics: {
          count: activeAssignmentData?.count || 0,
          revenue: activeAssignmentData?.revenue || 0,
        },
        totalAccountMetrics: {
          count: totalCount,
          revenue: totalRevenue,
        },
        assignments: formattedAssignments,
      };
    });

    return successResponse({ employees: formattedEmployees });
  } catch (error: any) {
    console.error('Fetch employees error:', error);
    return errorResponse(error.message || 'Failed to fetch employees', 500);
  }
}
