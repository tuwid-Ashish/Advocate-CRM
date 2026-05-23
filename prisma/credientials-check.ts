/**
 * Seed script for database initialization
 * Run: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('👤 Creating employees...');
    const adminPassword = await hashPassword('admin123');
    const employeePassword = await hashPassword('employee123');

    let employees = await prisma.employee.update({
        where: {
            email: "user4@example.com"
        },
        data: {
        password: employeePassword,
    
        },
      });

    console.log(`✅ Created ${employees} employees`);
}
main();
