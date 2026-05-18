import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(request) {
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
      // other stats can be added here
    };

    return NextResponse.json({ records, stats });
  } catch (error) {
    console.error('Error fetching PAN applications:', error);
    return NextResponse.json({ error: 'Failed to fetch PAN applications' }, { status: 500 });
  }
}
