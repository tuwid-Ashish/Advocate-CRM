/**
 * Focused seed data for checking create/update/display alignment.
 *
 * Run:
 *   npm run db:seed:audit
 *
 * Login:
 *   audit-admin@example.com / audit123
 *   audit-employee@example.com / audit123
 */

import { PrismaClient } from '@prisma/client';
// import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

const auditClientEmails = [
  'audit-pan@example.com',
  'audit-tan@example.com',
  'audit-gst-alpha@example.com',
  'audit-gst-beta@example.com',
  'audit-itr@example.com',
  'audit-tds@example.com',
  'audit-dsc@example.com',
];

// const auditEmployeeEmails = [
//   'audit-admin@example.com',
//   'audit-employee@example.com',
//   'system-extension@domain.com',
// ];

// async function cleanupAuditData() {
//   await prisma.gSTFiling.deleteMany({
//     where: { client: { email: { in: auditClientEmails } } },
//   });
//   await prisma.iTRRecord.deleteMany({
//     where: { client: { email: { in: auditClientEmails } } },
//   });
//   await prisma.oneTimeServiceDetail.deleteMany({
//     where: { serviceRecord: { client: { email: { in: auditClientEmails } } } },
//   });
//   await prisma.simpleBusinessServiceDetail.deleteMany({
//     where: { serviceRecord: { client: { email: { in: auditClientEmails } } } },
//   });
//   await prisma.payment.deleteMany({
//     where: { serviceRecord: { client: { email: { in: auditClientEmails } } } },
//   });
//   await prisma.serviceRecord.deleteMany({
//     where: { client: { email: { in: auditClientEmails } } },
//   });
//   await prisma.client.deleteMany({
//     where: { email: { in: auditClientEmails } },
//   });
//   await prisma.employee.deleteMany({
//     where: { email: { in: auditEmployeeEmails } },
//   });
// }

async function ensureServices() {
  const services = [
    ['PAN', 'PAN Card', 'ONE_TIME', 'MANUAL', 'SIMPLE'],
    ['TAN', 'TAN Registration', 'ONE_TIME', 'MANUAL', 'SIMPLE'],
    ['GST_3B', 'GST Form 3B', 'RECURRING', 'MANUAL', 'GST_RECORD'],
    ['GST_1', 'GST Form 1', 'RECURRING', 'MANUAL', 'GST_RECORD'],
    ['EXTRA_EXPENSE', 'Extra Expense', 'RECURRING', 'MANUAL', 'DETAILED_RECORD'],
    ['ITR', 'Income Tax Return', 'RECURRING', 'EXTENSION_FETCH', 'AUTO_FETCH_RECORD'],
    ['TDS', 'TDS Filing', 'RECURRING', 'MANUAL', 'DETAILED_RECORD'],
    ['DSC', 'Digital Signature Certificate', 'RECURRING', 'MANUAL', 'DETAILED_RECORD'],
  ] as const;

  await Promise.all(
    services.map(([code, name, category, automationType, dataFormat]) =>
      prisma.service.upsert({
        where: { code },
        update: { name, category, automationType, dataFormat, active: true },
        create: { code, name, category, automationType, dataFormat, active: true },
      })
    )
  );
}

async function main() {
  console.log('Starting audit seed...');
  // await cleanupAuditData();
  await ensureServices();

  // Reuse existing users from the database (no employee/admin creation).
  const admin = await prisma.employee.findFirst({
    where: { role: 'ADMIN', active: true },
    orderBy: { createdAt: 'asc' },
  });

  const employee = await prisma.employee.findFirst({
    where: { role: 'EMPLOYEE', active: true },
    orderBy: { createdAt: 'asc' },
  });

  const systemEmployee =
    (await prisma.employee.findUnique({
      where: { email: 'system-extension@domain.com' },
    })) || admin;

  if (!admin) {
    throw new Error('No active ADMIN user found. Please create at least one admin first.');
  }

  if (!employee) {
    throw new Error('No active EMPLOYEE user found. Please create at least one employee first.');
  }

  // const password = await bcryptjs.hash('audit123', 10);

  // const admin = await prisma.employee.create({
  //   data: {
  //     name: 'Audit Admin',
  //     email: 'audit-admin@example.com',
  //     phone: '9000000001',
  //     password,
  //     role: 'ADMIN',
  //     active: true,
  //   },
  // });

  // const employee = await prisma.employee.create({
  //   data: {
  //     name: 'Audit Employee',
  //     email: 'audit-employee@example.com',
  //     phone: '9000000002',
  //     password,
  //     role: 'EMPLOYEE',
  //     active: true,
  //   },
  // });

  // const systemEmployee = await prisma.employee.create({
  //   data: {
  //     name: 'Extension Integration',
  //     email: 'system-extension@domain.com',
  //     password,
  //     role: 'ADMIN',
  //     active: false,
  //   },
  // });

  const panClient = await prisma.client.create({
    data: {
      type: 'ONE_TIME_CUSTOMER',
      fullName: 'Audit PAN Customer',
      email: 'audit-pan@example.com',
      phone: '9000000101',
      emailVerified: true,
    },
  });

  const tanClient = await prisma.client.create({
    data: {
      type: 'ONE_TIME_CUSTOMER',
      fullName: 'Audit TAN Customer',
      email: 'audit-tan@example.com',
      phone: '9000000102',
      emailVerified: true,
    },
  });

  const gstAlpha = await prisma.client.create({
    data: {
      type: 'BUSINESS_CLIENT',
      businessName: 'Audit GST Alpha Traders',
      email: 'audit-gst-alpha@example.com',
      businessEmail: 'audit-gst-alpha@example.com',
      businessPhone: '9000000201',
      gstId: '27AAAAA0000A1Z5',
      panId: 'AAAAA0000A',
      contactPersonName: 'Alpha Accounts',
    },
  });

  const gstBeta = await prisma.client.create({
    data: {
      type: 'BUSINESS_CLIENT',
      businessName: 'Audit GST Beta Services',
      email: 'audit-gst-beta@example.com',
      businessEmail: 'audit-gst-beta@example.com',
      businessPhone: '9000000202',
      gstId: '27BBBBB1111B1Z5',
      panId: 'BBBBB1111B',
      contactPersonName: 'Beta Accounts',
    },
  });

  const itrClient = await prisma.client.create({
    data: {
      type: 'BUSINESS_CLIENT',
      businessName: 'Audit ITR Consulting',
      email: 'audit-itr@example.com',
      businessEmail: 'audit-itr@example.com',
      businessPhone: '9000000301',
      panId: 'CCCCC2222C',
    },
  });

  const tdsClient = await prisma.client.create({
    data: {
      type: 'BUSINESS_CLIENT',
      businessName: 'Audit TDS Manufacturing',
      email: 'audit-tds@example.com',
      businessEmail: 'audit-tds@example.com',
      businessPhone: '9000000401',
      panId: 'DDDDD3333D',
    },
  });

  const dscClient = await prisma.client.create({
    data: {
      type: 'BUSINESS_CLIENT',
      businessName: 'Audit DSC Exports',
      email: 'audit-dsc@example.com',
      businessEmail: 'audit-dsc@example.com',
      businessPhone: '9000000501',
      panId: 'EEEEE4444E',
    },
  });

  await prisma.serviceRecord.create({
    data: {
      serviceType: 'PAN',
      clientId: panClient.id,
      createdById: employee.id,
      status: 'PENDING',
      details: {
        kind: 'ONE_TIME',
        customerName: 'Audit PAN Customer',
        phone: '9000000101',
        email: 'audit-pan@example.com',
      },
      notes: 'Audit seed: edit name, phone, email, amount, status.',
      oneTimeDetail: {
        create: {
          customerName: 'Audit PAN Customer',
          phone: '9000000101',
          email: 'audit-pan@example.com',
          reference: 'audit-pan@example.com',
        },
      },
      payment: {
        create: {
          amount: 500,
          mode: 'CASH',
          status: 'COMPLETED',
          receivedDate: new Date('2026-05-01T10:00:00+05:30'),
          receivedById: employee.id,
        },
      },
    },
  });

  await prisma.serviceRecord.create({
    data: {
      serviceType: 'TAN',
      clientId: tanClient.id,
      createdById: employee.id,
      status: 'IN_PROGRESS',
      details: {
        kind: 'ONE_TIME',
        customerName: 'Audit TAN Customer',
        phone: '9000000102',
        email: 'audit-tan@example.com',
      },
      notes: 'Audit seed: one-time TAN path.',
      oneTimeDetail: {
        create: {
          customerName: 'Audit TAN Customer',
          phone: '9000000102',
          email: 'audit-tan@example.com',
          reference: 'audit-tan@example.com',
        },
      },
      payment: {
        create: {
          amount: 700,
          mode: 'UPI',
          status: 'COMPLETED',
          receivedDate: new Date('2026-05-02T10:00:00+05:30'),
          receivedById: employee.id,
        },
      },
    },
  });

  const gst3bRecord = await prisma.serviceRecord.create({
    data: {
      serviceType: 'GST_3B',
      clientId: gstAlpha.id,
      createdById: employee.id,
      status: 'PENDING',
      details: {
        kind: 'GST',
        partyName: 'Audit GST Alpha Traders',
        gstType: 'GST_3B',
        monthNumber: 4,
        month: 'APRIL',
        year: 2026,
        filingDate: null,
      },
      notes: 'Audit seed: GST 3B should update ServiceRecord.details and GSTFiling.',
      payment: {
        create: {
          amount: 1500,
          mode: 'UPI',
          status: 'COMPLETED',
          receivedDate: new Date('2026-05-03T10:00:00+05:30'),
          receivedById: employee.id,
        },
      },
    },
  });

  await prisma.gSTFiling.create({
    data: {
      serviceRecordId: gst3bRecord.id,
      clientId: gstAlpha.id,
      gstType: 'GST_3B',
      gstNumber: gstAlpha.gstId,
      partyName: 'Audit GST Alpha Traders',
      month: 'APRIL',
      monthNumber: 4,
      year: 2026,
      outwardSupply: 425000,
      inwardSupply: 275000,
      gstLiability: 18000,
      filingStatus: 'PENDING',
      dueDate: new Date('2026-05-20T00:00:00+05:30'),
    },
  });

  const gst1Record = await prisma.serviceRecord.create({
    data: {
      serviceType: 'GST_1',
      clientId: gstBeta.id,
      createdById: employee.id,
      status: 'COMPLETED',
      completedDate: new Date('2026-05-10T10:00:00+05:30'),
      details: {
        kind: 'GST',
        partyName: 'Audit GST Beta Services',
        gstType: 'GST_1',
        monthNumber: 3,
        month: 'MARCH',
        year: 2026,
        filingDate: '2026-05-10',
      },
      notes: 'Audit seed: GST 1 completed path.',
      payment: {
        create: {
          amount: 1800,
          mode: 'CREDIT',
          status: 'COMPLETED',
          receivedDate: new Date('2026-05-04T10:00:00+05:30'),
          receivedById: admin.id,
        },
      },
    },
  });

  await prisma.gSTFiling.create({
    data: {
      serviceRecordId: gst1Record.id,
      clientId: gstBeta.id,
      gstType: 'GST_1',
      gstNumber: gstBeta.gstId,
      partyName: 'Audit GST Beta Services',
      month: 'MARCH',
      monthNumber: 3,
      year: 2026,
      outwardSupply: 825000,
      inwardSupply: 0,
      gstLiability: 0,
      filingStatus: 'FILED',
      filingDate: new Date('2026-05-10T00:00:00+05:30'),
      dueDate: new Date('2026-04-11T00:00:00+05:30'),
    },
  });

  const itrRecord = await prisma.serviceRecord.create({
    data: {
      serviceType: 'ITR',
      clientId: itrClient.id,
      createdById: systemEmployee.id,
      status: 'IN_PROGRESS',
      details: {
        kind: 'ITR',
        itr_form: 'ITR-3',
        assessment_year: '2026-27',
        filing_status: 'IN_PROGRESS',
        filing_date: null,
        total_income: 1250000,
        tax_paid: 85000,
        refund_status: 'Pending review',
        source: 'audit_seed',
      },
      notes: 'Audit seed: ITR details should render from ITRRecord first, then JSON fallback.',
    },
  });

  await prisma.iTRRecord.create({
    data: {
      serviceRecordId: itrRecord.id,
      clientId: itrClient.id,
      itrForm: 'ITR-3',
      financialYear: '2026-27',
      grossTotalIncome: 1250000,
      totalTaxableIncome: 1100000,
      totalTaxPayable: 85000,
      refund: 0,
      sourceExtension: 'audit_seed',
      fetchedAt: new Date('2026-05-05T10:00:00+05:30'),
      rawData: {
        itr_form: 'ITR-3',
        assessment_year: '2026-27',
        filing_status: 'IN_PROGRESS',
      },
      filingStatus: 'IN_PROGRESS',
      filingDate: null,
    },
  });

  await prisma.serviceRecord.create({
    data: {
      serviceType: 'TDS',
      clientId: tdsClient.id,
      createdById: employee.id,
      status: 'PENDING',
      details: {
        kind: 'SIMPLE_BUSINESS',
        x: 'Q4 FY 2025-26',
        y: 'Form 26Q',
      },
      notes: 'Audit seed: simple business path for TDS.',
      simpleDetail: {
        create: {
          x: 'Q4 FY 2025-26',
          y: 'Form 26Q',
        },
      },
      payment: {
        create: {
          amount: 2200,
          mode: 'CASH',
          status: 'COMPLETED',
          receivedDate: new Date('2026-05-06T10:00:00+05:30'),
          receivedById: employee.id,
        },
      },
    },
  });

  await prisma.serviceRecord.create({
    data: {
      serviceType: 'DSC',
      clientId: dscClient.id,
      createdById: admin.id,
      status: 'ARCHIVED',
      details: {
        kind: 'SIMPLE_BUSINESS',
        x: 'Class 3 DSC',
        y: '2 year validity',
      },
      notes: 'Audit seed: archived status and no payment row. Editing amount above zero should create Payment.',
      simpleDetail: {
        create: {
          x: 'Class 3 DSC',
          y: '2 year validity',
        },
      },
    },
  });

  await prisma.panApplication.create({
    data: {
      ackNo: 'AUDITPAN0001',
      couponNo: 'AUDITCPN0001',
      name: 'Audit PAN Application',
      applicationType: 'New PAN',
      date: new Date('2026-05-07T00:00:00+05:30'),
      status: 'Under Process',
      pan: null,
      modeOfSubmission: 'Physical',
    },
  });

  await prisma.tanPtdsApplication.create({
    data: {
      sourceType: 'TAN',
      acknowledgmentNo: 'AUDITTAN0001',
      receiptDate: new Date('2026-05-08T00:00:00+05:30'),
      tan: null,
      category: 'Company',
      applicantName: 'Audit TAN Application',
      applicationType: 'New TAN',
      changesRequested: null,
      userId: 'AUDITUSER',
      feesCharged: 65,
    },
  });

  console.log('Audit seed completed.');
  console.log(`Used existing users -> Admin: ${admin.email}, Employee: ${employee.email}`);
  console.log('Edit these rows in Service Records: Audit PAN, TAN, GST Alpha, GST Beta, ITR, TDS, DSC.');
}

main()
  .catch((error) => {
    console.error('Audit seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
