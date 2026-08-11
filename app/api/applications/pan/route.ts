export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [records, todayStats] = await prisma.$transaction([
      prisma.panApplication.findMany({
        orderBy: {
          date: 'desc',
        },
      }),
      prisma.panApplication.count({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    const stats = {
      today: todayStats,
    };

    return NextResponse.json({ records, stats });
  } catch (error) {
    console.error('Error fetching PAN applications:', error);
    return NextResponse.json({ error: 'Failed to fetch PAN applications' }, { status: 500 });
  }
}
