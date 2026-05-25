import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest, errorResponse, successResponse, errorResponseFromException } from '@/lib/middleware';

/**
 * PUT /api/records/[id]
 * Update a service record
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedReq = authenticateRequest(request);
    const user = authenticatedReq.user!;
    const { id } = await params;

    const body = await request.json();
    const {
      serviceType,
      clientId,
      details,
      notes,
      paymentAmount,
      paymentMode,
      paymentStatus,
      status,
    } = body;

    // Verify record exists
    const existingRecord = await prisma.serviceRecord.findUnique({
      where: { id },
      include: { payment: true, extraExpenseRecord: true },
    });

    if (!existingRecord) {
      return errorResponse('Service record not found', 404);
    }

    const numericPaymentAmount = Number(paymentAmount || 0);
    const recordStatus = status || existingRecord.status;
    const recordPaymentStatus = paymentStatus || existingRecord.paymentStatus || (numericPaymentAmount > 0 ? 'PAID' : 'PENDING');

    // Update the main record
    const updatedRecord = await prisma.serviceRecord.update({
      where: { id },
      data: {
        serviceType: (serviceType || existingRecord.serviceType) as any,
        clientId: clientId || existingRecord.clientId,
        details: details !== undefined ? details : existingRecord.details,
        notes: notes !== undefined ? notes : existingRecord.notes,
        status: recordStatus as any,
        paymentStatus: recordPaymentStatus as any,
        completedDate: recordStatus === 'COMPLETED' ? new Date() : existingRecord.completedDate,
      },
    });

    // Update payment if provided
    if (paymentAmount !== undefined || paymentMode !== undefined) {
      if (existingRecord.payment) {
        await prisma.payment.update({
          where: { id: existingRecord.payment.id },
          data: {
            amount: numericPaymentAmount,
            mode: paymentMode || existingRecord.payment.mode,
            status: recordPaymentStatus as any,
            receivedById: user.id,
          },
        });
      } else if (numericPaymentAmount > 0) {
        await prisma.payment.create({
          data: {
            serviceRecordId: id,
            amount: numericPaymentAmount,
            mode: paymentMode || 'CASH',
            status: recordPaymentStatus as any,
            receivedDate: new Date(),
            receivedById: user.id,
          },
        });
      }
    }

    // Sync specific detail models if service type changed or details provided
    if (details) {
      // Clean up old specific details to keep it simple (or update them)
      // For simplicity in this cockpit, we update the Json 'details' field in ServiceRecord,
      // but we should also try to sync the specialized tables if they exist.
      
      if (details.kind === 'ONE_TIME') {
        await prisma.oneTimeServiceDetail.upsert({
          where: { serviceRecordId: id },
          create: {
            serviceRecordId: id,
            customerName: details.customerName,
            phone: details.phone,
            email: details.email,
            reference: details.reference,
          },
          update: {
            customerName: details.customerName,
            phone: details.phone,
            email: details.email,
            reference: details.reference,
          },
        });
      }

      if (details.kind === 'SIMPLE_BUSINESS') {
        await prisma.simpleBusinessServiceDetail.upsert({
          where: { serviceRecordId: id },
          create: {
            serviceRecordId: id,
            x: details.x,
            y: details.y,
          },
          update: {
            x: details.x,
            y: details.y,
          },
        });
      }

      if (details.kind === 'GST' || (serviceType && (serviceType === 'GST_3B' || serviceType === 'GST_1'))) {
         // GST Sync
         const monthNumber = Number(details.monthNumber || 1);
         const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
         
         // Find existing filing by serviceRecordId since GSTFiling.id is an independent PK
         const existingGst = await prisma.gSTFiling.findFirst({ where: { serviceRecordId: id } });
         if (existingGst) {
           await prisma.gSTFiling.update({
             where: { id: existingGst.id },
             data: {
               partyName: details.partyName,
               month: months[monthNumber - 1],
               monthNumber,
               year: Number(details.year),
               filingStatus: details.filingDate ? 'FILED' : 'PENDING',
               filingDate: details.filingDate ? new Date(details.filingDate) : null,
               clientId: clientId || existingRecord.clientId,
               gstType: (serviceType || existingRecord.serviceType) as any,
             },
           });
         } else {
           await prisma.gSTFiling.create({
             data: {
               serviceRecordId: id,
               clientId: clientId || existingRecord.clientId,
               gstType: (serviceType || existingRecord.serviceType) as any,
               partyName: details.partyName || '',
               month: months[monthNumber - 1] || 'JANUARY',
               monthNumber,
               year: Number(details.year || new Date().getFullYear()),
               filingStatus: details.filingDate ? 'FILED' : 'PENDING',
               filingDate: details.filingDate ? new Date(details.filingDate) : null,
             },
           });
         }
      }

      if (details.kind === 'EXTRA_EXPENSE' || serviceType === 'EXTRA_EXPENSE') {
        const monthNumber = Number(details.monthNumber || 1);
        const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

        await prisma.extraExpenseRecord.upsert({
          where: { serviceRecordId: id },
          create: {
            serviceRecordId: id,
            clientId: clientId || existingRecord.clientId,
            expenseTitle: details.expenseTitle || details.title || 'Expense',
            expenseCategory: details.expenseCategory || null,
            month: months[monthNumber - 1] || 'JANUARY',
            monthNumber,
            year: Number(details.year || new Date().getFullYear()),
            amount: Number(details.amount || numericPaymentAmount || 0),
            expenseDate: details.expenseDate ? new Date(details.expenseDate) : null,
            notes: notes !== undefined ? notes : existingRecord.notes,
          },
          update: {
            expenseTitle: details.expenseTitle || details.title || 'Expense',
            expenseCategory: details.expenseCategory || null,
            month: months[monthNumber - 1] || 'JANUARY',
            monthNumber,
            year: Number(details.year || new Date().getFullYear()),
            amount: Number(details.amount || numericPaymentAmount || 0),
            expenseDate: details.expenseDate ? new Date(details.expenseDate) : null,
            notes: notes !== undefined ? notes : existingRecord.notes,
          },
        });
      }
    }

    return successResponse({
      message: 'Record updated successfully',
      record: updatedRecord,
    });
  } catch (error: any) {
    console.error('Update record error:', error);
    return errorResponseFromException(error, 'Failed to update record', 500);
  }
}

/**
 * DELETE /api/records/[id]
 * Delete a service record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    authenticateRequest(request);
    const { id } = await params;

    await prisma.serviceRecord.delete({
      where: { id },
    });

    return successResponse({
      message: 'Record deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete record error:', error);
    return errorResponseFromException(error, 'Failed to delete record', 500);
  }
}
