/**
 * Clients API Routes
 * GET /api/clients - List all clients (filtered by role)
/**
 * Clients API Routes
 * GET /api/clients - List all clients (filtered by role)
 * POST /api/clients - Create a new client
 * GET /api/clients/[id] - Get specific client
 * PUT /api/clients/[id] - Update client
 * DELETE /api/clients/[id] - Delete client
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';


/**
 * GET /api/clients
 * List all clients or filter by type
 * All authenticated office users see the same client list.
 */
export async function GET(request: NextRequest) {
  try {
    authenticateRequest(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'ONE_TIME_CUSTOMER' or 'BUSINESS_CLIENT'

    let where: any = {};

    if (type) {
      where.type = type;
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        serviceRecords: {
          select: {
            id: true,
            serviceType: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ clients });
  } catch (error: any) {
    console.error('Get clients error:', error);
    return errorResponse(error.message || 'Failed to fetch clients', 500);
  }
}

/**
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const body = await request.json();

    const {
      type,
      fullName,
      businessName,
      email,
      phone,
      businessPhone,
      businessEmail,
      gstId,
      panId,
      addressStreet,
      addressCity,
      addressState,
      addressPincode,
      contactPersonName,
      contactPersonPhone,
      contactPersonEmail,
    } = body;

    // Validation
    if (!type || !email) {
      return errorResponse('Missing required fields: type, email', 400);
    }

    if (type === 'ONE_TIME_CUSTOMER' && !fullName) {
      return errorResponse('Full name is required for one-time customers', 400);
    }

    if (type === 'BUSINESS_CLIENT' && !businessName) {
      return errorResponse('Business name is required for business clients', 400);
    }

    // Check if email already exists
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (existingClient) {
      return errorResponse('Client with this email already exists', 409);
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        type,
        fullName: type === 'ONE_TIME_CUSTOMER' ? fullName : null,
        businessName: type === 'BUSINESS_CLIENT' ? businessName : null,
        email,
        phone: type === 'ONE_TIME_CUSTOMER' ? phone : null,
        businessPhone: type === 'BUSINESS_CLIENT' ? businessPhone || phone || null : null,
        businessEmail: type === 'BUSINESS_CLIENT' ? businessEmail || email || null : null,
        gstId: type === 'BUSINESS_CLIENT' ? gstId : null,
        panId: type === 'BUSINESS_CLIENT' ? panId : null,
        addressStreet,
        addressCity,
        addressState,
        addressPincode,
        contactPersonName,
        contactPersonPhone,
        contactPersonEmail,
      },
    });

    return successResponse(
      {
        message: 'Client created successfully',
        client,
      },
      201
    );
  } catch (error: any) {
    console.error('Create client error:', error);
    return errorResponse(error.message || 'Failed to create client', 500);
  }
}
