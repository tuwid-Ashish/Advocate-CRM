import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse } from '@/lib/middleware';

async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
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
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticateRequest(request);
    const { id } = await params;

    const client = await getClientById(id);
    if (!client) {
      return errorResponse('Client not found', 404);
    }

    return successResponse({ client });
  } catch (error: any) {
    console.error('Get client error:', error);
    return errorResponse(error.message || 'Failed to fetch client', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticateRequest(request);
    const { id } = await params;
    const body = await request.json();

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      return errorResponse('Client not found', 404);
    }

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

    if (!email) {
      return errorResponse('Email is required', 400);
    }

    const clientType = type || existingClient.type;

    if (clientType === 'ONE_TIME_CUSTOMER' && !fullName) {
      return errorResponse('Full name is required for one-time customers', 400);
    }

    if (clientType === 'BUSINESS_CLIENT' && !businessName) {
      return errorResponse('Business name is required for business clients', 400);
    }

    const duplicate = await prisma.client.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (duplicate) {
      return errorResponse('Client with this email already exists', 409);
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        type: clientType,
        fullName: clientType === 'ONE_TIME_CUSTOMER' ? fullName || null : null,
        businessName: clientType === 'BUSINESS_CLIENT' ? businessName || null : null,
        email,
        phone: clientType === 'ONE_TIME_CUSTOMER' ? phone || null : null,
        businessPhone: clientType === 'BUSINESS_CLIENT' ? businessPhone || phone || null : null,
        businessEmail: clientType === 'BUSINESS_CLIENT' ? businessEmail || email || null : null,
        gstId: clientType === 'BUSINESS_CLIENT' ? gstId || null : null,
        panId: clientType === 'BUSINESS_CLIENT' ? panId || null : null,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressPincode: addressPincode || null,
        contactPersonName: contactPersonName || null,
        contactPersonPhone: contactPersonPhone || null,
        contactPersonEmail: contactPersonEmail || null,
      },
    });

    return successResponse({ message: 'Client updated successfully', client });
  } catch (error: any) {
    console.error('Update client error:', error);
    return errorResponse(error.message || 'Failed to update client', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticateRequest(request);
    const { id } = await params;

    await prisma.client.delete({ where: { id } });

    return successResponse({ message: 'Client deleted successfully' });
  } catch (error: any) {
    console.error('Delete client error:', error);
    return errorResponse(error.message || 'Failed to delete client', 500);
  }
}
