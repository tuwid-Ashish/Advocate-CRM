/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats
 * Returns metrics and stats based on user role
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    let dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let recordWhere: any = {};
    if (Object.keys(dateFilter).length > 0) {
      recordWhere.createdAt = dateFilter;
    }

    // Fetch data
    const [
      totalRecords,
      totalClients,
      recordsByStatus,
      recordsByServiceType,
      paymentStats,
    ] = await Promise.all([
      prisma.serviceRecord.count({ where: recordWhere }),
      prisma.client.count(),
      prisma.serviceRecord.groupBy({
        by: ['status'],
        where: recordWhere,
        _count: true,
      }),
      prisma.serviceRecord.groupBy({
        by: ['serviceType'],
        where: recordWhere,
        _count: true,
      }),
      prisma.payment.groupBy({
        by: ['mode', 'status'],
        where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Calculate metrics
    const statusBreakdown = recordsByStatus.reduce(
      (acc: any, item: any) => ({
        ...acc,
        [item.status]: item._count,
      }),
      {}
    );

    const serviceBreakdown = recordsByServiceType.reduce(
      (acc: any, item: any) => ({
        ...acc,
        [item.serviceType]: item._count,
      }),
      {}
    );

    const paymentBreakdown = paymentStats.reduce(
      (acc: any, item: any) => {
        const key = `${item.mode}_${item.status}`;
        acc[key] = item._sum.amount || 0;
        return acc;
      },
      {}
    );

    const totalRevenue = paymentStats
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p._sum.amount || 0), 0);

    return successResponse({
      role: user.role,
      metrics: {
        totalRecords,
        totalClients,
        totalRevenue,
        pendingRecords: statusBreakdown['PENDING'] || 0,
        completedRecords: statusBreakdown['COMPLETED'] || 0,
        inProgressRecords: statusBreakdown['IN_PROGRESS'] || 0,
      },
      breakdown: {
        status: statusBreakdown,
        serviceType: serviceBreakdown,
        payment: paymentBreakdown,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return errorResponse(error.message || 'Failed to fetch dashboard stats', 500);
  }
}
