/**
 * Prisma Client Singleton
 * Ensures single instance of Prisma Client across the application
 */

import { PrismaClient } from '@prisma/client';

// Avoid instantiating PrismaClient in every file during hot reload in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
