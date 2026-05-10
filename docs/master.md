# CA Operations Platform — Master Development Specification

## Project Overview

This project is currently a demo CRM dashboard built with dummy/static data.

Current Demo URL:
[CA CRM Demo](https://crm-eight-orcin.vercel.app/?utm_source=chatgpt.com)

The objective is to transform this demo into a production-ready Compliance Operations Platform for a CA office.

The system must support:
- one-time services
- recurring compliance workflows
- payment tracking
- GST operations
- ITR extension ingestion
- operational dashboards
- client management
- scalable backend architecture

This is NOT a generic CRM.

This should function as a:
> Compliance Operations System

---

# Existing Project State

The current application already contains:
- frontend UI
- dashboard layouts
- cards
- tables
- navigation
- pages
- demo analytics
- dummy records

These must now be converted into:
- real backend-driven features
- database-driven dashboards
- actual CRUD operations
- live statistics
- production architecture

---

# Core Operational Understanding

The CA office operations are divided into 2 categories.

---

# 1. One-Time Services

Services:
- PAN
- TAN

Characteristics:
- Mostly one-time customers
- Manual data entry
- Direct payment collection

Required Customer Data:
- Name
- Phone
- Email

Payment Modes:
- Cash
- UPI
- Credit

Additional Requirement:
- Email verification tracking

---

# 2. Recurring Compliance Services

Services:
- GST
- TDS
- DSC
- ITR

Characteristics:
- Recurring business clients
- Monthly / quarterly / yearly workflows
- Ongoing filing management

Important:
- Only ITR is auto-fetched through browser extension
- Everything else is manually entered

Current operational estimate:
- ~25 recurring businesses

---

# GST Workflow Requirements

GST records require:
- Party/business selector
- GST type
  - GST 3B
  - GST 1
- Monthly selection
- Filing date
- Payment tracking

---

# ITR Workflow Requirements

ITR records:
- Auto-fetched through browser extension
- Sent to backend API
- Parsed
- Stored as operational records
- Reviewable from admin dashboard

---

# Important Architecture Rule

DO NOT create separate tables like:

- GSTTable
- PANTable
- TDSTable

The system must use:
- generic clients
- generic services
- unified service records

This is critical for scalability.

---

# Final Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Backend | Next.js App Router APIs |
| Database | PostgreSQL |
| Database Provider | Neon |
| ORM | Prisma |
| UI | TailwindCSS + ShadCN |
| State Management | React Query or Zustand |
| Authentication | Clerk/Auth.js |
| Extension Integration | REST API |

---

# Database Design

---

# Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ClientType {
  INDIVIDUAL
  BUSINESS
}

enum ServiceName {
  PAN
  TAN
  GST_3B
  GST_1
  TDS
  DSC
  ITR
}

enum ServiceCategory {
  ONE_TIME
  RECURRING
}

enum AutomationType {
  MANUAL
  EXTENSION_FETCH
}

enum FilingStatus {
  PENDING
  FILED
  FAILED
}

enum PaymentStatus {
  PAID
  PARTIAL
  UNPAID
}

enum RecordSource {
  MANUAL
  EXTENSION
}

enum PaymentMode {
  CASH
  UPI
  CREDIT
}

enum ComplianceFrequency {
  MONTHLY
  QUARTERLY
  YEARLY
}

enum ImportStatus {
  PENDING
  SUCCESS
  FAILED
}

model Client {
  id                String   @id @default(cuid())

  clientType        ClientType

  fullName          String?
  businessName      String?

  email             String?  @unique
  phone             String?

  emailVerified     Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  serviceRecords    ServiceRecord[]
  recurringConfigs  RecurringCompliance[]
}

model Service {
  id                String   @id @default(cuid())

  name              ServiceName
  category          ServiceCategory
  automationType    AutomationType

  active            Boolean @default(true)

  records           ServiceRecord[]
  recurringConfigs  RecurringCompliance[]
}

model ServiceRecord {
  id                String   @id @default(cuid())

  clientId          String
  serviceId         String

  financialYear     String?
  filingMonth       String?

  status            FilingStatus @default(PENDING)

  filingDate        DateTime?

  amount            Float?

  paymentStatus     PaymentStatus @default(UNPAID)

  notes             String?

  source            RecordSource @default(MANUAL)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  client            Client @relation(fields: [clientId], references: [id])
  service           Service @relation(fields: [serviceId], references: [id])

  payments          Payment[]

  @@index([clientId])
  @@index([serviceId])
  @@index([filingDate])
}

model Payment {
  id                String   @id @default(cuid())

  serviceRecordId   String

  amount            Float

  paymentMode       PaymentMode

  referenceNumber   String?

  paidAt            DateTime @default(now())

  createdAt         DateTime @default(now())

  serviceRecord     ServiceRecord @relation(fields: [serviceRecordId], references: [id])

  @@index([serviceRecordId])
}

model RecurringCompliance {
  id                String   @id @default(cuid())

  clientId          String
  serviceId         String

  frequency         ComplianceFrequency

  active            Boolean @default(true)

  startDate         DateTime
  endDate           DateTime?

  createdAt         DateTime @default(now())

  client            Client @relation(fields: [clientId], references: [id])
  service           Service @relation(fields: [serviceId], references: [id])
}

model ITRImportLog {
  id                String   @id @default(cuid())

  rawPayload        Json

  parsedPayload     Json?

  importStatus      ImportStatus @default(PENDING)

  createdAt         DateTime @default(now())
}