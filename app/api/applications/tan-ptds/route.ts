export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApplicationSourceType } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [records, todayTanCount, todayPtdsCount] = await prisma.$transaction([
      prisma.tanPtdsApplication.findMany({
        orderBy: {
          receiptDate: 'desc',
        },
      }),
      prisma.tanPtdsApplication.count({
        where: {
          sourceType: ApplicationSourceType.TAN,
          receiptDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.tanPtdsApplication.count({
        where: {
          sourceType: ApplicationSourceType.PTDS,
          receiptDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const stats = {
      todayTan: todayTanCount,
      todayPtds: todayPtdsCount,
    };

    return NextResponse.json({ records, stats });
  } catch (error) {
    console.error('Error fetching TAN/PTDS applications:', error);
    return NextResponse.json({ error: 'Failed to fetch TAN/PTDS applications' }, { status: 500 });
  }
}
