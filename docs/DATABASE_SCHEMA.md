# Database Schema Design - CA Services System

This document provides complete database schemas for SQL and NoSQL implementations of the CA services system.

---

## 🗄️ OPTION 1: PostgreSQL Schema (Recommended for Relational Data)

### 1. CLIENTS TABLE (Unified for both one-time and recurring)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('ONE_TIME_CUSTOMER', 'BUSINESS_CLIENT')),
  
  -- For One-Time Customers
  full_name VARCHAR(255),
  
  -- For Business Clients
  business_name VARCHAR(255),
  gst_id VARCHAR(20),
  pan_id VARCHAR(10),
  
  -- Common Fields
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_date TIMESTAMP,
  
  -- Address (for businesses)
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_pincode VARCHAR(10),
  
  -- Contact Person (for businesses)
  contact_person_name VARCHAR(255),
  contact_person_phone VARCHAR(20),
  contact_person_email VARCHAR(255),
  
  -- Assigned Employee
  assigned_employee_id UUID REFERENCES employees(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES employees(id),
  
  INDEX idx_type (type),
  INDEX idx_email (email),
  INDEX idx_business_name (business_name)
);
```

### 2. SERVICES TABLE (Service Configuration)

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('ONE_TIME', 'RECURRING')),
  automation_type VARCHAR(50) NOT NULL CHECK (automation_type IN ('MANUAL', 'EXTENSION_FETCH')),
  data_format VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_category (category)
);

-- Insert service data
INSERT INTO services (code, name, category, automation_type, data_format) VALUES
('PAN', 'PAN Card', 'ONE_TIME', 'MANUAL', 'SIMPLE'),
('TAN', 'TAN Registration', 'ONE_TIME', 'MANUAL', 'SIMPLE'),
('GST_3B', 'GST Form 3B', 'RECURRING', 'MANUAL', 'GST_RECORD'),
('GST_1', 'GST Form 1', 'RECURRING', 'MANUAL', 'GST_RECORD'),
('ITR', 'Income Tax Return', 'RECURRING', 'EXTENSION_FETCH', 'AUTO_FETCH_RECORD'),
('TDS', 'TDS Filing', 'RECURRING', 'MANUAL', 'DETAILED_RECORD'),
('DSC', 'Digital Signature Certificate', 'RECURRING', 'MANUAL', 'DETAILED_RECORD');
```

### 3. CLIENT_SERVICES TABLE (Which services are enabled for each client)

```sql
CREATE TABLE client_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id),
  enabled BOOLEAN DEFAULT TRUE,
  
  -- For recurring services, track filing cycle
  filing_cycle VARCHAR(50) CHECK (filing_cycle IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(client_id, service_id),
  INDEX idx_client_id (client_id),
  INDEX idx_service_id (service_id)
);
```

### 4. SERVICE_RECORDS TABLE (Generic service record table)

```sql
CREATE TABLE service_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(50) NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED')),
  
  -- Metadata stored as JSONB for flexibility
  details JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_date TIMESTAMP,
  created_by UUID REFERENCES employees(id),
  
  -- Notes
  notes TEXT,
  
  INDEX idx_service_type (service_type),
  INDEX idx_client_id (client_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 5. GST_FILINGS TABLE (Monthly GST record tracking)

```sql
CREATE TABLE gst_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID REFERENCES service_records(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES clients(id),
  
  -- Filing details
  gst_type VARCHAR(50) NOT NULL CHECK (gst_type IN ('GST_3B', 'GST_1')),
  gst_number VARCHAR(20),
  month VARCHAR(50) NOT NULL,
  month_number INTEGER CHECK (month_number BETWEEN 1 AND 12),
  year INTEGER,
  
  -- Filing amounts
  outward_supply DECIMAL(15, 2),
  inward_supply DECIMAL(15, 2),
  gst_liability DECIMAL(15, 2),
  
  -- Status
  filing_status VARCHAR(50) DEFAULT 'PENDING' CHECK (filing_status IN ('PENDING', 'IN_PROGRESS', 'FILED')),
  filing_date TIMESTAMP,
  due_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_business_id (business_id),
  INDEX idx_month_year (year, month_number),
  INDEX idx_gst_number (gst_number)
);
```

### 6. ITR_RECORDS TABLE (Income Tax Return specific)

```sql
CREATE TABLE itr_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID REFERENCES service_records(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES clients(id),
  
  -- Auto-fetched data
  itr_form VARCHAR(20),
  financial_year VARCHAR(20),
  gross_total_income DECIMAL(15, 2),
  total_taxable_income DECIMAL(15, 2),
  total_tax_payable DECIMAL(15, 2),
  refund DECIMAL(15, 2),
  
  -- Extension details
  source_extension VARCHAR(100),
  fetched_at TIMESTAMP,
  raw_data JSONB, -- Store full auto-fetch data
  
  -- Filing status
  filing_status VARCHAR(50) DEFAULT 'PENDING' CHECK (filing_status IN ('PENDING', 'FILED')),
  filing_date TIMESTAMP,
  ack_number VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_business_id (business_id),
  INDEX idx_financial_year (financial_year)
);
```

### 7. PAYMENTS TABLE (Payment tracking)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(15, 2) NOT NULL,
  mode VARCHAR(50) NOT NULL CHECK (mode IN ('CASH', 'UPI', 'CREDIT')),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
  
  -- Receiver info
  received_date TIMESTAMP,
  received_by UUID REFERENCES employees(id),
  
  -- Transaction reference
  transaction_reference VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_service_record_id (service_record_id),
  INDEX idx_status (status),
  INDEX idx_received_date (received_date)
);
```

### 8. ATTACHMENTS TABLE (File storage references)

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_record_id UUID REFERENCES service_records(id) ON DELETE CASCADE,
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  
  -- Upload metadata
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_service_record_id (service_record_id)
);
```

### 9. EMPLOYEES TABLE (CA staff)

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

### 10. AUDIT_LOG TABLE (Track all changes)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE
  changes JSONB,
  changed_by UUID REFERENCES employees(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_changed_at (changed_at)
);
```

---

## 🔄 Key Relationships & Views

```sql
-- View: All GST filings for a business
CREATE VIEW gst_filings_view AS
SELECT 
  g.id,
  c.business_name,
  c.gst_id,
  g.gst_type,
  g.month,
  g.year,
  g.gst_liability,
  g.filing_status,
  g.filing_date
FROM gst_filings g
JOIN clients c ON g.business_id = c.id
WHERE g.filing_status IN ('PENDING', 'IN_PROGRESS');

-- View: Revenue summary
CREATE VIEW revenue_summary AS
SELECT 
  DATE_TRUNC('month', p.received_date) AS month,
  p.mode,
  SUM(p.amount) AS total_amount,
  COUNT(p.id) AS transaction_count
FROM payments p
WHERE p.status = 'COMPLETED'
GROUP BY DATE_TRUNC('month', p.received_date), p.mode;

-- View: Client service status
CREATE VIEW client_service_status AS
SELECT 
  c.id,
  c.full_name,
  c.business_name,
  s.code,
  sr.status,
  COUNT(sr.id) AS record_count
FROM clients c
JOIN client_services cs ON c.id = cs.client_id
JOIN services s ON cs.service_id = s.id
LEFT JOIN service_records sr ON c.id = sr.client_id AND sr.service_type = s.code
GROUP BY c.id, s.id, sr.status;
```

---

## 🗄️ OPTION 2: MongoDB Schema (Document-based)

### Collections Structure

#### 1. clients Collection

```javascript
db.createCollection("clients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["type", "email", "createdAt"],
      properties: {
        _id: { bsonType: "objectId" },
        type: {
          enum: ["ONE_TIME_CUSTOMER", "BUSINESS_CLIENT"],
          description: "Type of client"
        },
        
        // One-time customer fields
        personalDetails: {
          bsonType: "object",
          properties: {
            fullName: { bsonType: "string" },
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            emailVerified: { bsonType: "bool" },
            verificationToken: { bsonType: "string" },
            verificationDate: { bsonType: "date" }
          }
        },
        
        // Business client fields
        businessDetails: {
          bsonType: "object",
          properties: {
            businessName: { bsonType: "string" },
            gstId: { bsonType: "string" },
            panId: { bsonType: "string" },
            email: { bsonType: "string" },
            phone: { bsonType: "string" },
            address: {
              bsonType: "object",
              properties: {
                street: { bsonType: "string" },
                city: { bsonType: "string" },
                state: { bsonType: "string" },
                pincode: { bsonType: "string" }
              }
            }
          }
        },
        
        contactPerson: {
          bsonType: "object",
          properties: {
            name: { bsonType: "string" },
            phone: { bsonType: "string" },
            email: { bsonType: "string" }
          }
        },
        
        services: {
          bsonType: "object",
          properties: {
            gst: { bsonType: "object" },
            itr: { bsonType: "object" },
            tds: { bsonType: "object" },
            dsc: { bsonType: "object" }
          }
        },
        
        assignedEmployeeId: { bsonType: "objectId" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        createdBy: { bsonType: "objectId" }
      }
    }
  }
});

db.clients.createIndex({ email: 1 }, { unique: true });
db.clients.createIndex({ type: 1 });
db.clients.createIndex({ businessName: 1 });
```

#### 2. service_records Collection

```javascript
db.createCollection("service_records", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["serviceType", "clientId", "status"],
      properties: {
        _id: { bsonType: "objectId" },
        serviceType: {
          enum: ["PAN", "TAN", "GST_3B", "GST_1", "ITR", "TDS", "DSC"]
        },
        clientId: { bsonType: "objectId" },
        status: {
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]
        },
        
        // Service-specific details
        clientDetails: { bsonType: "object" },
        serviceDetails: { bsonType: "object" },
        autoFetchedData: { bsonType: "object" },
        
        // Payment
        payment: {
          bsonType: "object",
          properties: {
            amount: { bsonType: "double" },
            mode: { enum: ["CASH", "UPI", "CREDIT"] },
            status: { enum: ["PENDING", "COMPLETED"] },
            receivedDate: { bsonType: "date" },
            receivedBy: { bsonType: "objectId" }
          }
        },
        
        // Timestamps
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        completedDate: { bsonType: "date" },
        createdBy: { bsonType: "objectId" },
        
        notes: { bsonType: "string" },
        attachments: { bsonType: "array" }
      }
    }
  }
});

db.service_records.createIndex({ clientId: 1, serviceType: 1 });
db.service_records.createIndex({ status: 1 });
db.service_records.createIndex({ createdAt: -1 });
```

#### 3. gst_filings Sub-document (within service_records)

For GST records, include monthly filings as an array:

```javascript
// In service_records document with serviceType = "GST_3B" or "GST_1"
{
  ...otherFields,
  filingDetails: {
    months: [
      {
        month: "JANUARY",
        monthNumber: 1,
        year: 2026,
        status: "FILED",
        filingDate: ISODate("2026-02-10"),
        outwardSupply: 500000,
        inwardSupply: 300000,
        gstLiability: 24000
      },
      // ... more months
    ]
  }
}
```

#### 4. Indexes for Better Performance

```javascript
// Create indexes for common queries
db.service_records.createIndex({ "payment.status": 1, "payment.receivedDate": -1 });
db.service_records.createIndex({ serviceType: 1, "filingDetails.months.status": 1 });
db.clients.createIndex({ assignedEmployeeId: 1, type: 1 });
```

---

## 🔍 Sample Queries

### PostgreSQL

```sql
-- Revenue by payment mode
SELECT mode, SUM(amount) as total
FROM payments
WHERE status = 'COMPLETED'
  AND received_date >= CURRENT_DATE - INTERVAL '1 month'
GROUP BY mode;

-- Pending GST filings
SELECT 
  c.business_name,
  g.gst_type,
  g.month,
  g.year,
  g.due_date
FROM gst_filings g
JOIN clients c ON g.business_id = c.id
WHERE g.filing_status = 'PENDING'
ORDER BY g.due_date ASC;

-- Employee performance
SELECT 
  e.name,
  COUNT(sr.id) AS records_handled,
  COUNT(CASE WHEN sr.status = 'COMPLETED' THEN 1 END) AS completed,
  SUM(p.amount) AS total_revenue
FROM employees e
LEFT JOIN service_records sr ON e.id = sr.created_by
LEFT JOIN payments p ON sr.id = p.service_record_id AND p.status = 'COMPLETED'
WHERE sr.created_at >= CURRENT_DATE - INTERVAL '1 month'
GROUP BY e.id
ORDER BY total_revenue DESC;
```

### MongoDB

```javascript
// Revenue by payment mode (last 30 days)
db.service_records.aggregate([
  {
    $match: {
      "payment.status": "COMPLETED",
      "payment.receivedDate": { $gte: new Date(Date.now() - 30*24*60*60*1000) }
    }
  },
  {
    $group: {
      _id: "$payment.mode",
      total: { $sum: "$payment.amount" },
      count: { $sum: 1 }
    }
  }
]);

// Pending GST filings
db.service_records.find({
  serviceType: { $in: ["GST_3B", "GST_1"] },
  "filingDetails.months": {
    $elemMatch: { status: "PENDING" }
  }
}).project({
  _id: 1,
  clientId: 1,
  serviceType: 1,
  "filingDetails.months": {
    $filter: {
      input: "$filingDetails.months",
      as: "month",
      cond: { $eq: ["$$month.status", "PENDING"] }
    }
  }
});
```

---

## 🔐 Database Security Best Practices

1. **Access Control**: Restrict database access by role
2. **Encryption**: Encrypt sensitive fields (PAN, GST ID)
3. **Audit Logging**: Log all modifications
4. **Backup Strategy**: Daily backups with point-in-time recovery
5. **Password Policies**: Strong database user passwords
6. **Network Security**: Database accessible only from app server

---

## 📊 Migration Path

**Phase 1 (Current)**: JSON files in `/data/`
↓
**Phase 2**: PostgreSQL with Prisma ORM
↓
**Phase 3**: Add caching layer (Redis)
↓
**Phase 4**: Implement read replicas for reporting

---

