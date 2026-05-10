# CA Services Data Model & Storage Design

## 📋 Executive Summary
This document outlines the complete data model structure for managing CA services across one-time and recurring client engagements. The system supports 25 registered businesses with auto-fetch capabilities for ITR.

---

## 🏗️ Core Data Model Architecture

### 1. SERVICE TYPES & CATEGORIES

```json
{
  "services": [
    {
      "id": "service-pan",
      "name": "PAN",
      "category": "ONE_TIME",
      "automationType": "MANUAL",
      "requiredFields": ["customerDetails", "paymentInfo"],
      "dataFormat": "SIMPLE"
    },
    {
      "id": "service-tan",
      "name": "TAN",
      "category": "ONE_TIME",
      "automationType": "MANUAL",
      "requiredFields": ["customerDetails", "paymentInfo"],
      "dataFormat": "SIMPLE"
    },
    {
      "id": "service-dsc",
      "name": "DSC",
      "category": "RECURRING",
      "automationType": "MANUAL",
      "requiredFields": ["partyName", "details", "paymentInfo"],
      "dataFormat": "DETAILED_RECORD"
    },
    {
      "id": "service-tds",
      "name": "TDS",
      "category": "RECURRING",
      "automationType": "MANUAL",
      "requiredFields": ["partyName", "details", "period", "paymentInfo"],
      "dataFormat": "DETAILED_RECORD"
    },
    {
      "id": "service-itr",
      "name": "ITR",
      "category": "RECURRING",
      "automationType": "EXTENSION_FETCH",
      "requiredFields": ["partyName", "partyDetails", "paymentInfo"],
      "dataFormat": "AUTO_FETCH_RECORD"
    },
    {
      "id": "service-gst-3b",
      "name": "GST (Form 3B)",
      "category": "RECURRING",
      "automationType": "MANUAL",
      "requiredFields": ["partyName", "gstType", "monthlySelection", "filingDate"],
      "dataFormat": "GST_RECORD"
    },
    {
      "id": "service-gst-1",
      "name": "GST (Form 1)",
      "category": "RECURRING",
      "automationType": "MANUAL",
      "requiredFields": ["partyName", "gstType", "monthlySelection", "filingDate"],
      "dataFormat": "GST_RECORD"
    }
  ]
}
```

---

## 👥 CLIENT MODELS

### 1. ONE-TIME CLIENT (for PAN, TAN services)

```javascript
{
  "id": "onetime-client-001",
  "type": "ONE_TIME_CUSTOMER",
  "personalDetails": {
    "fullName": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "phone": "+91-9876543210",
    "emailVerified": true,
    "verificationToken": "unique-uuid-token",
    "verificationDate": "2026-04-18T10:30:00Z"
  },
  "services": [
    {
      "serviceId": "service-pan",
      "serviceDate": "2026-04-18",
      "status": "COMPLETED"
    },
    {
      "serviceId": "service-tan",
      "serviceDate": "2026-04-19",
      "status": "PENDING"
    }
  ],
  "createdAt": "2026-04-18T10:30:00.000Z",
  "updatedAt": "2026-04-19T14:00:00.000Z"
}
```

### 2. RECURRING CLIENT / BUSINESS (for recurring services)

```javascript
{
  "id": "business-client-001",
  "type": "BUSINESS_CLIENT",
  "businessDetails": {
    "businessName": "Sai Traders",
    "gstId": "18AABCU1234F1Z5",
    "panId": "AAABR5055K",
    "email": "accounts@saitraders.in",
    "phone": "+91-9876500022",
    "address": {
      "street": "123 Market Street",
      "city": "Bangalore",
      "state": "KA",
      "pincode": "560001"
    }
  },
  "contactPerson": {
    "name": "Priya Sharma",
    "phone": "+91-9876500025",
    "email": "priya@saitraders.in"
  },
  "services": {
    "gst": {
      "enabled": true,
      "type": ["GST_3B", "GST_1"],
      "filingCycle": "MONTHLY"
    },
    "itr": {
      "enabled": true,
      "type": "ITR_FILING",
      "filingCycle": "ANNUAL"
    },
    "tds": {
      "enabled": true,
      "type": "TDS_QUARTERLY",
      "filingCycle": "QUARTERLY"
    },
    "dsc": {
      "enabled": true,
      "lastRenewalDate": "2026-03-15",
      "nextRenewalDate": "2027-03-15"
    }
  },
  "assignedEmployee": "emp-002",
  "createdAt": "2026-04-18T10:30:00.000Z",
  "updatedAt": "2026-04-21T09:10:00.000Z"
}
```

---

## 📊 SERVICE RECORD MODELS

### 1. ONE-TIME SERVICE RECORD (PAN / TAN)

```javascript
{
  "id": "record-onetime-001",
  "serviceType": "PAN",
  "clientId": "onetime-client-001",
  "clientDetails": {
    "fullName": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "phone": "+91-9876543210"
  },
  "payment": {
    "amount": 500,
    "mode": "CASH",
    "status": "COMPLETED",
    "receivedDate": "2026-04-18",
    "receivedBy": "emp-001"
  },
  "status": "COMPLETED",
  "completedDate": "2026-04-18",
  "notes": "Document submitted for PAN application",
  "createdAt": "2026-04-18T10:30:00.000Z",
  "updatedAt": "2026-04-18T15:00:00.000Z"
}
```

### 2. DETAILED SERVICE RECORD (DSC, TDS)

**Format**: `[details] from [period] payment [amount] mode [cash/upi/credit]`

```javascript
{
  "id": "record-detailed-001",
  "serviceType": "TDS",
  "businessId": "business-client-001",
  "businessName": "Sai Traders",
  
  // The core detail structure
  "serviceDetails": {
    "description": "TDS filing for Q1 2026-27",
    "detailRecords": [
      {
        "vendorName": "XYZ Supplier Ltd",
        "tdsAmount": 5000,
        "totalAmount": 50000,
        "deductionDate": "2026-03-15"
      },
      {
        "vendorName": "ABC Services",
        "tdsAmount": 2000,
        "totalAmount": 20000,
        "deductionDate": "2026-03-20"
      }
    ],
    "period": {
      "from": "2026-01-01",
      "to": "2026-03-31",
      "quarter": "Q1"
    }
  },
  
  // Payment tracking
  "payment": {
    "totalAmount": 3000,
    "mode": "UPI",
    "status": "PENDING",
    "dueDate": "2026-04-15",
    "receivedBy": "emp-002"
  },
  
  "status": "IN_PROGRESS",
  "attachments": ["form-24Q.pdf", "payment-proof.jpg"],
  "createdAt": "2026-04-01T10:30:00.000Z",
  "updatedAt": "2026-04-10T14:00:00.000Z"
}
```

### 3. ITR SERVICE RECORD (Auto-Fetch)

**Format**: `[details_auto_fetched] from [period] payment [amount] mode [cash/upi/credit]`

```javascript
{
  "id": "record-itr-001",
  "serviceType": "ITR",
  "businessId": "business-client-001",
  "businessName": "Sai Traders",
  
  // Auto-fetched details from extension
  "autoFetchedData": {
    "sourceExtension": "CA_TAX_EXTENSION_V2.0",
    "fetchedAt": "2026-04-10T10:30:00.000Z",
    "itrForm": "ITR_2",
    "financialYear": "2025-26",
    "grossTotalIncome": 2500000,
    "totalTaxableIncome": 2400000,
    "totalTaxPayable": 480000,
    "refund": 25000,
    "rawJsonData": { /* detailed tax data */ }
  },
  
  // Period covered
  "period": {
    "financialYearStart": "2025-04-01",
    "financialYearEnd": "2026-03-31",
    "fy": "2025-26"
  },
  
  // Payment tracking
  "payment": {
    "serviceFee": 5000,
    "mode": "CREDIT",
    "status": "COMPLETED",
    "receivedDate": "2026-04-10",
    "receivedBy": "emp-001"
  },
  
  "filingStatus": "FILED",
  "filingDate": "2026-04-11",
  "ackNumber": "ITR-ACK-2026-0012345",
  "attachments": ["ITR_2_acknowledgement.pdf"],
  "createdAt": "2026-04-10T10:30:00.000Z",
  "updatedAt": "2026-04-11T15:00:00.000Z"
}
```

### 4. GST SERVICE RECORD

**Format**: `[partyName, gstType, monthly_selection, filing_date]`

```javascript
{
  "id": "record-gst-001",
  "serviceType": "GST",
  "businessId": "business-client-001",
  
  // Party/Business Details
  "party": {
    "name": "Sai Traders",
    "gstNumber": "18AABCU1234F1Z5",
    "businessType": "TRADING"
  },
  
  // GST Form Type
  "gstType": "GST_3B",
  
  // Monthly filing details
  "filingDetails": {
    "months": [
      {
        "month": "JANUARY",
        "monthNumber": 1,
        "year": 2026,
        "status": "FILED",
        "filingDate": "2026-02-10",
        "outwardSupply": 500000,
        "inwardSupply": 300000,
        "gstLiability": 24000
      },
      {
        "month": "FEBRUARY",
        "monthNumber": 2,
        "year": 2026,
        "status": "FILED",
        "filingDate": "2026-03-10",
        "outwardSupply": 450000,
        "inwardSupply": 280000,
        "gstLiability": 21000
      },
      {
        "month": "MARCH",
        "monthNumber": 3,
        "year": 2026,
        "status": "PENDING",
        "dueDate": "2026-04-12"
      }
    ]
  },
  
  // Payment for service
  "payment": {
    "serviceFee": 1500,
    "mode": "CREDIT",
    "status": "COMPLETED",
    "receivedDate": "2026-01-15",
    "billingCycle": "MONTHLY"
  },
  
  "createdAt": "2026-01-10T10:30:00.000Z",
  "updatedAt": "2026-03-20T14:00:00.000Z"
}
```

---

## 💾 STORAGE STRUCTURE

### Option 1: JSON File Structure (Current)
```
data/
├── clients/
│   ├── one-time-clients.json
│   └── recurring-clients.json
├── services/
│   ├── service-config.json
├── records/
│   ├── one-time-records.json
│   ├── detailed-records.json
│   ├── itr-records.json
│   └── gst-records.json
└── transactions.json
```

### Option 2: Database Schema (PostgreSQL/MongoDB)

#### Collections/Tables:

1. **clients** (both one-time and recurring)
2. **businesses** (the 25 registered businesses)
3. **service_records** (with serviceType discriminator)
4. **gst_filings** (monthly GST records)
5. **payments** (tracked separately)
6. **employees** (CA staff)

---

## 🔄 KEY RELATIONSHIPS & DATA FLOW

### One-Time Service Flow:
```
Customer (email verified)
    ↓
One-Time Service Record (PAN/TAN)
    ↓
Payment Tracking
    ↓
Completion & Archive
```

### Recurring Service Flow:
```
Business Client (registered)
    ↓
Service Enabled (GST/ITR/TDS/DSC)
    ↓
Service Record Created
    ↓
For GST: Monthly filings
    ↓
Payment Tracking
    ↓
Status Update & Filing
```

---

## 📋 DETAILED FIELD SPECIFICATIONS

### Common Fields (All Records)
```javascript
{
  "id": "unique-uuid",
  "serviceType": "PAN|TAN|GST|ITR|TDS|DSC",
  "status": "PENDING|IN_PROGRESS|COMPLETED|ARCHIVED",
  "payment": {
    "amount": Number,
    "mode": "CASH|UPI|CREDIT",
    "status": "PENDING|COMPLETED",
    "receivedDate": ISO8601,
    "receivedBy": "employee-id"
  },
  "createdAt": ISO8601,
  "updatedAt": ISO8601,
  "createdBy": "employee-id",
  "notes": String
}
```

### Customer Details (One-Time Services)
```javascript
{
  "fullName": String,
  "email": String (unique identifier),
  "phone": String,
  "emailVerified": Boolean,
  "verificationToken": String,
  "verificationDate": ISO8601
}
```

### Business Details (Recurring Services)
```javascript
{
  "businessName": String,
  "gstId": String (optional),
  "panId": String,
  "email": String,
  "phone": String,
  "address": {
    "street": String,
    "city": String,
    "state": String,
    "pincode": String
  },
  "contactPerson": {
    "name": String,
    "phone": String,
    "email": String
  }
}
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Core Data Models
- [ ] Create client models (one-time + recurring)
- [ ] Create service record schemas
- [ ] Define payment tracking structure

### Phase 2: Storage Layer
- [ ] Update JSON file structure
- [ ] Create API routes for CRUD operations
- [ ] Implement data validation

### Phase 3: Service-Specific Logic
- [ ] One-time service handling (PAN/TAN)
- [ ] Detailed record handling (DSC/TDS)
- [ ] GST monthly filing logic
- [ ] ITR auto-fetch integration

### Phase 4: Advanced Features
- [ ] Payment tracking & reconciliation
- [ ] Email verification system
- [ ] File attachments management
- [ ] Recurring service reminders
- [ ] Employee assignment & tracking

---

## 🔐 Data Validation Rules

### Required for One-Time Services:
- Email (must be unique & verified)
- Full name
- Phone number
- Service type
- Payment mode & amount

### Required for Recurring Services:
- Business name
- GST ID (if GST service enabled)
- PAN ID
- Contact person
- Email
- Service selection (which services enabled)

### Required for Payments:
- Amount > 0
- Mode: one of [CASH, UPI, CREDIT]
- Received date (cannot be future date)
- Received by: valid employee ID

---

## 📈 Scalability Considerations

1. **For 25 Businesses**: Index by business ID for quick lookup
2. **Monthly GST Filings**: Partition GST records by year-month
3. **ITR Auto-Fetch**: Cache fetched data with version tracking
4. **Payment History**: Maintain audit trail of all changes
5. **Archive Strategy**: Move completed records older than 2 years to archive collection

---

## 🚀 Next Steps

1. Choose storage approach (JSON for MVP, DB for scale)
2. Create utility functions for data validation
3. Build API routes for each service type
4. Implement UI components for data entry
5. Set up email verification system
