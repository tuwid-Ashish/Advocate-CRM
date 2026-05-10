/**
 * Service Records API Routes
 * GET /api/records - List service records
 * POST /api/records - Create a new service record
 * GET /api/records/[id] - Get specific record
 * PUT /api/records/[id] - Update record
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';

/**
 * GET /api/records
 * List service records
 * All authenticated office users see the same service records.
 */
export async function GET(request: NextRequest) {
  try {
    authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '10');

    let where: any = {};

    if (serviceType) where.serviceType = serviceType;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [records, total] = await Promise.all([
      prisma.serviceRecord.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              type: true,
              fullName: true,
              businessName: true,
              email: true,
              phone: true,
              businessPhone: true,
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          payment: {
            include: {
              receivedBy: {
                select: { id: true, name: true },
              },
            },
          },
          gstFilings: true,
          itrRecord: true,
          oneTimeDetail: true,
          simpleDetail: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.serviceRecord.count({ where }),
    ]);

    return successResponse({
      records,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error('Get records error:', error);
    return errorResponse(error.message || 'Failed to fetch records', 500);
  }
}

/**
 * POST /api/records
 * Create a new service record
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;

    const body = await request.json();
    const {
      serviceType,
      clientId,
      details,
      notes,
      paymentAmount,
      paymentMode,
      status,
    } = body;

    // Validation
    if (!serviceType || !clientId) {
      return errorResponse('Missing required fields: serviceType, clientId', 400);
    }

    // Verify client exists and user has access
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return errorResponse('Client not found', 404);
    }

    const numericPaymentAmount = Number(paymentAmount || 0);
    const recordStatus = status || 'PENDING';
    const isGstRecord = serviceType === 'GST_3B' || serviceType === 'GST_1';

    const createdRecord = await prisma.serviceRecord.create({
      data: {
        serviceType: serviceType as any,
        clientId,
        details: details || null,
        notes: notes || null,
        createdById: user.id,
        status: recordStatus as any,
        completedDate: recordStatus === 'COMPLETED' ? new Date() : null,
        payment:
          numericPaymentAmount > 0
            ? {
                create: {
                  amount: numericPaymentAmount,
                  mode: paymentMode || 'CASH',
                  status: 'COMPLETED',
                  receivedDate: new Date(),
                  receivedById: user.id,
                },
              }
            : undefined,
      },
    });

    if (isGstRecord && details) {
      await prisma.gSTFiling.create({
        data: {
          serviceRecordId: createdRecord.id,
          clientId,
          gstType: serviceType as any,
          gstNumber: client.gstId || null,
          partyName: details.partyName,
          month: details.month?.toUpperCase() || '',
          monthNumber: Number(details.monthNumber),
          year: Number(details.year),
          filingStatus: details.filingDate ? 'FILED' : 'PENDING',
          filingDate: details.filingDate ? new Date(details.filingDate) : null,
        },
      });
    }

    if (details?.kind === 'ONE_TIME') {
      await prisma.oneTimeServiceDetail.create({
        data: {
          serviceRecord: {
            connect: { id: createdRecord.id },
          },
          customerName: details.customerName,
          phone: details.phone || null,
          email: details.email,
        },
      });
    }

    if (details?.kind === 'SIMPLE_BUSINESS') {
      await prisma.simpleBusinessServiceDetail.create({
        data: {
          serviceRecord: {
            connect: { id: createdRecord.id },
          },
          x: details.x,
          y: details.y,
        },
      });
    }

    const record = await prisma.serviceRecord.findUnique({
      where: { id: createdRecord.id },
      include: {
        client: true,
        createdBy: {
          select: { id: true, name: true },
        },
        payment: true,
        gstFilings: true,
        itrRecord: true,
        oneTimeDetail: true,
        simpleDetail: true,
      },
    });

    return successResponse(
      {
        message: 'Service record created successfully',
        record,
      },
      201
    );
  } catch (error: any) {
    console.error('Create record error:', error);
    return errorResponse(error.message || 'Failed to create record', 500);
  }
}
