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

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await prisma.gSTFiling.deleteMany();
    await prisma.iTRRecord.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.serviceRecord.deleteMany();
    await prisma.client.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.service.deleteMany();

    // 1. Create Services
    console.log('📋 Creating services...');
    const services = await Promise.all([
      prisma.service.create({
        data: {
          code: 'PAN',
          name: 'PAN Card',
          category: 'ONE_TIME',
          automationType: 'MANUAL',
          dataFormat: 'SIMPLE',
        },
      }),
      prisma.service.create({
        data: {
          code: 'TAN',
          name: 'TAN Registration',
          category: 'ONE_TIME',
          automationType: 'MANUAL',
          dataFormat: 'SIMPLE',
        },
      }),
      prisma.service.create({
        data: {
          code: 'GST_3B',
          name: 'GST Form 3B',
          category: 'RECURRING',
          automationType: 'MANUAL',
          dataFormat: 'GST_RECORD',
        },
      }),
      prisma.service.create({
        data: {
          code: 'GST_1',
          name: 'GST Form 1',
          category: 'RECURRING',
          automationType: 'MANUAL',
          dataFormat: 'GST_RECORD',
        },
      }),
      prisma.service.create({
        data: {
          code: 'ITR',
          name: 'Income Tax Return',
          category: 'RECURRING',
          automationType: 'EXTENSION_FETCH',
          dataFormat: 'AUTO_FETCH_RECORD',
        },
      }),
      prisma.service.create({
        data: {
          code: 'TDS',
          name: 'TDS Filing',
          category: 'RECURRING',
          automationType: 'MANUAL',
          dataFormat: 'DETAILED_RECORD',
        },
      }),
      prisma.service.create({
        data: {
          code: 'DSC',
          name: 'Digital Signature Certificate',
          category: 'RECURRING',
          automationType: 'MANUAL',
          dataFormat: 'DETAILED_RECORD',
        },
      }),
    ]);

    console.log(`✅ Created ${services.length} services`);

    // 2. Create Employees
    console.log('👤 Creating employees...');
    const adminPassword = await hashPassword('admin123');
    const employeePassword = await hashPassword('employee123');

    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          name: 'Admin User',
          email: 'admin@example.com',
          phone: '9876543210',
          password: adminPassword,
          role: 'ADMIN',
          active: true,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Amit Kumar',
          email: 'amit@example.com',
          phone: '9876543211',
          password: employeePassword,
          role: 'EMPLOYEE',
          active: true,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Neha Sharma',
          email: 'neha@example.com',
          phone: '9876543212',
          password: employeePassword,
          role: 'EMPLOYEE',
          active: true,
        },
      }),
      prisma.employee.create({
        data: {
          name: 'Rajesh Patel',
          email: 'rajesh@example.com',
          phone: '9876543213',
          password: employeePassword,
          role: 'EMPLOYEE',
          active: true,
        },
      }),
    prisma.employee.create({
        data: {
          name: 'Mina kumari',
          email: 'mina@example.com',
          phone: '9876543223',
          password: "employee123",
          role: 'EMPLOYEE',
          active: true,
        },
      }),
      prisma.employee.create({
        data: {
        name: "Extension Integration",
        email: "system-extension@domain.com",
        password: "system-generated-no-login",
        role: "ADMIN",
        active: false,
        },
      }),
    ]);

    console.log(`✅ Created ${employees.length} employees`);

    // 3. Create Clients (One-Time)
    console.log('👥 Creating one-time clients...');
    const oneTimeClients = await Promise.all([
      prisma.client.create({
        data: {
          type: 'ONE_TIME_CUSTOMER',
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543220',
          emailVerified: true,
        },
      }),
      prisma.client.create({
        data: {
          type: 'ONE_TIME_CUSTOMER',
          fullName: 'Sarah Smith',
          email: 'sarah@example.com',
          phone: '9876543221',
          emailVerified: true,
        },
      }),
    ]);

    console.log(`✅ Created ${oneTimeClients.length} one-time clients`);

    // 4. Create Business Clients (Recurring)
    console.log('🏢 Creating business clients...');
    const businessClients = await Promise.all([
      prisma.client.create({
        data: ({
          type: 'BUSINESS_CLIENT',
          businessName: 'Sai Traders',
          gstId: '18AABCU1234F1Z5',
          panId: 'AAABR5055K',
          email: 'accounts@saitraders.in',
          businessEmail: 'accounts@saitraders.in',
          businessPhone: '9876500022',
          addressStreet: '123 Market Street',
          addressCity: 'Bangalore',
          addressState: 'KA',
          addressPincode: '560001',
          contactPersonName: 'Priya Sharma',
          contactPersonPhone: '9876500025',
          contactPersonEmail: 'priya@saitraders.in',
        } as any),
      }),
      prisma.client.create({
        data: ({
          type: 'BUSINESS_CLIENT',
          businessName: 'Green Valley Pharma',
          gstId: '18AABCV5678G2Z9',
          panId: 'BBBBR6066L',
          email: 'finance@greenvalleypharma.com',
          businessEmail: 'finance@greenvalleypharma.com',
          businessPhone: '9876500033',
          addressStreet: '456 Industrial Park',
          addressCity: 'Hyderabad',
          addressState: 'TG',
          addressPincode: '500001',
          contactPersonName: 'Amit Reddy',
          contactPersonPhone: '9876500035',
          contactPersonEmail: 'amit@greenvalleypharma.com',
        } as any),
      }),
      prisma.client.create({
        data: ({
          type: 'BUSINESS_CLIENT',
          businessName: 'Digital Solutions Ltd',
          gstId: '18AABCW9012H3Z7',
          panId: 'CCCCS7077M',
          email: 'accounts@digitalsolutions.in',
          businessEmail: 'accounts@digitalsolutions.in',
          businessPhone: '9876500044',
          addressStreet: '789 Tech Park',
          addressCity: 'Pune',
          addressState: 'MH',
          addressPincode: '411001',
          contactPersonName: 'Sneha Gupta',
          contactPersonPhone: '9876500045',
          contactPersonEmail: 'sneha@digitalsolutions.in',
        } as any),
      }),
    ]);

    console.log(`✅ Created ${businessClients.length} business clients`);

    // 5. Create Service Records
    console.log('📝 Creating service records...');
    const records = await Promise.all([
      // PAN record for one-time customer
      prisma.serviceRecord.create({
        data: {
          serviceType: 'PAN',
          clientId: oneTimeClients[0].id,
          createdById: employees[1].id,
          status: 'COMPLETED',
          details: {
            panNumber: 'AAABR5055K',
            application: 'PAN Application',
          },
          payment: {
            create: {
              amount: 500,
              mode: 'CASH',
              status: 'COMPLETED',
              receivedDate: new Date('2026-04-15'),
              receivedById: employees[1].id,
            },
          },
          completedDate: new Date('2026-04-15'),
        },
      }),
      // GST record for business
      prisma.serviceRecord.create({
        data: {
          serviceType: 'GST_3B',
          clientId: businessClients[0].id,
          createdById: employees[1].id,
          status: 'PENDING',
          details: { year: 2026 },
          payment: {
            create: {
              amount: 1500,
              mode: 'UPI',
              status: 'COMPLETED',
              receivedDate: new Date('2026-04-01'),
              receivedById: employees[1].id,
            },
          },
        },
      }),
    ]);

    console.log(`✅ Created ${records.length} service records`);

    // 6. Create GST Filings
    console.log('📊 Creating GST filings...');
    const gstFilings = await Promise.all([
      prisma.gSTFiling.create({
        data: {
          serviceRecordId: records[1].id,
          clientId: businessClients[0].id,
          gstType: 'GST_3B',
          gstNumber: '18AABCU1234F1Z5',
          partyName: 'Sai Traders',
          month: 'JANUARY',
          monthNumber: 1,
          year: 2026,
          outwardSupply: 500000,
          inwardSupply: 300000,
          gstLiability: 24000,
          filingStatus: 'FILED',
          filingDate: new Date('2026-02-10'),
          dueDate: new Date('2026-02-20'),
        },
      }),
      prisma.gSTFiling.create({
        data: {
          serviceRecordId: records[1].id,
          clientId: businessClients[0].id,
          gstType: 'GST_3B',
          gstNumber: '18AABCU1234F1Z5',
          partyName: 'Sai Traders',
          month: 'FEBRUARY',
          monthNumber: 2,
          year: 2026,
          outwardSupply: 450000,
          inwardSupply: 280000,
          gstLiability: 21000,
          filingStatus: 'PENDING',
          dueDate: new Date('2026-03-20'),
        },
      }),
    ]);

    console.log(`✅ Created ${gstFilings.length} GST filings`);

    console.log('✨ Database seed completed successfully!');
    console.log('\n📝 Demo Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Employee: amit@example.com / employee123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
