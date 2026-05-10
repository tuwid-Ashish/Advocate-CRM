# 🚀 Backend Setup Guide - Neon PostgreSQL + Role-Based Access

Complete guide to setting up your CA Services backend with Neon PostgreSQL, authentication, and role-based access control.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Neon)](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installation & Dependencies](#installation--dependencies)
5. [Database Schema & Prisma](#database-schema--prisma)
6. [API Endpoints](#api-endpoints)
7. [Authentication Flow](#authentication-flow)
8. [Role-Based Access](#role-based-access)
9. [Running the Application](#running-the-application)
10. [Testing](#testing)

---

## Prerequisites

- Node.js 18+ installed
- A Neon PostgreSQL account (free tier available)
- Git
- Code editor (VS Code recommended)

---

## Database Setup (Neon)

### Step 1: Create a Neon Project

1. Go to [Neon Console](https://console.neon.tech)
2. Sign up or log in
3. Click **Create Project**
4. Configure:
   - **Project Name**: `ca-services-db`
   - **Region**: Choose closest to you
   - **PostgreSQL Version**: Latest (15 or higher)
5. Click **Create Project**

### Step 2: Get Your Connection String

1. In Neon Console, click your project
2. Copy the **Database Connection String** with format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```
3. Save this for the environment configuration

---

## Environment Configuration

### Create `.env.local` File

```bash
# Database Connection String (from Neon)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-cool-name.us-east-1.aws.neon.tech/neondb?sslmode=require"

# JWT Secret for Authentication
JWT_SECRET="your-super-secret-key-change-this-in-production"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"

# Optional: For production
# NEXT_PUBLIC_API_URL="https://your-domain.com"
# NODE_ENV="production"
```

**Important**: Never commit `.env.local` to version control. Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## Installation & Dependencies

### Step 1: Install Node Packages

```bash
npm install
```

This installs:
- `@prisma/client` - Database ORM
- `prisma` - Database toolkit
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT auth tokens
- `zod` - Data validation
- And other dependencies

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

---

## Database Schema & Prisma

### Step 1: Review Schema

Located in `prisma/schema.prisma`, defines:
- **Employee** - Admin and Employee users
- **Client** - Both one-time and recurring clients
- **Service** - Service definitions (PAN, TAN, GST, etc.)
- **ServiceRecord** - Individual service transactions
- **Payment** - Payment tracking
- **GSTFiling** - Monthly GST filings
- **ITRRecord** - Income tax returns
- **Attachment** - File uploads

### Step 2: Create Database Tables

```bash
# Run initial migration
npx prisma migrate dev --name init

# Or reset database (caution: deletes all data)
npm run db:reset
```

### Step 3: Seed Demo Data

```bash
npm run db:seed
```

This creates:
- Demo employees (admin + 3 employees)
- Demo clients (2 one-time + 3 business)
- Demo service records
- Demo GST filings

**Demo Credentials:**
- **Admin**: admin@example.com / admin123
- **Employee**: amit@example.com / employee123

---

## API Endpoints

### Authentication Routes

```
POST /api/auth/register
  Body: { name, email, phone, password, role }
  Returns: { token, user }

POST /api/auth/login
  Body: { email, password }
  Returns: { token, user }
```

### Client Management Routes

```
GET /api/clients
  Query: ?type=ONE_TIME_CUSTOMER|BUSINESS_CLIENT
  Headers: Authorization: Bearer <token>
  Returns: { clients }

POST /api/clients
  Headers: Authorization: Bearer <token>
  Body: { type, fullName/businessName, email, phone, ... }
  Returns: { message, client }
```

### Service Records Routes

```
GET /api/records
  Query: ?serviceType=PAN&status=PENDING&skip=0&take=10
  Headers: Authorization: Bearer <token>
  Returns: { records, pagination }

POST /api/records
  Headers: Authorization: Bearer <token>
  Body: { serviceType, clientId, details, paymentAmount, paymentMode }
  Returns: { message, record }
```

### GST Filing Routes

```
GET /api/gst
  Query: ?businessId=...&year=2026&status=FILED
  Headers: Authorization: Bearer <token>
  Returns: { filings }

POST /api/gst
  Headers: Authorization: Bearer <token>
  Body: { serviceRecordId, clientId, gstType, month, year, ... }
  Returns: { message, filing }
```

### Dashboard Statistics

```
GET /api/dashboard/stats
  Query: ?startDate=2026-01-01&endDate=2026-12-31
  Headers: Authorization: Bearer <token>
  Returns: { metrics, breakdown }
```

---

## Authentication Flow

### 1. User Registration/Login

```
User enters credentials
    ↓
POST /api/auth/login
    ↓
Server validates password (bcrypt)
    ↓
Creates JWT token
    ↓
Returns token + user info
    ↓
Client stores in localStorage
```

### 2. Subsequent Requests

```
Client adds Authorization header:
  Authorization: Bearer <jwt_token>
    ↓
Server validates token
    ↓
Extracts user ID & role
    ↓
Processes request with user context
```

### 3. Token Expiry

- Token valid for 24 hours
- Expired token returns 401 Unauthorized
- User must re-login

---

## Role-Based Access

### Admin Capabilities

✅ View all clients (one-time & business)
✅ View all service records
✅ Create any client
✅ Manage employees
✅ View complete dashboard with all charts
✅ Access employees tab
✅ View all data regardless of assignment

### Employee Capabilities

✅ View assigned clients only
✅ Create/update records for assigned clients
✅ View their own created records
✅ Limited dashboard (no employee charts)
✅ Cannot access employees tab
✅ Cannot manage other employees

### Authorization Examples

**Admin can do:**
```javascript
// See all clients
GET /api/clients

// Create any client
POST /api/clients
```

**Employee can do:**
```javascript
// See only assigned clients
GET /api/clients
// (filtered by assignedEmployeeId)

// Create clients
POST /api/clients
```

**Employee cannot do:**
```
GET /api/employees  // Returns 403 Forbidden
DELETE /api/clients/123  // Returns 403 Forbidden
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Access application at: `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

### Database Management UI

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555` for:
- Viewing all database records
- Editing data
- Creating new records
- Debugging

---

## Testing

### Test Login Flow

1. **Open Application**
   - Go to `http://localhost:3000/login`

2. **Login as Admin**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Click **Admin Demo** button

3. **Expected**: Redirects to `/dashboard` with admin view

4. **Login as Employee**
   - Email: `amit@example.com`
   - Password: `employee123`
   - Click **Employee Demo** button

5. **Expected**: Redirects to `/dashboard` with employee view

### Test API Endpoints

Use Postman, Insomnia, or cURL:

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "...", "name": "Admin User", "email": "admin@example.com", "role": "ADMIN" }
# }

# 2. Get Records (use token from login)
curl -X GET http://localhost:3000/api/records \
  -H "Authorization: Bearer <token_from_above>"

# 3. Create Service Record
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "PAN",
    "clientId": "...",
    "details": {},
    "paymentAmount": 500,
    "paymentMode": "CASH"
  }'
```

---

## Directory Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   ├── clients/route.ts
│   ├── records/route.ts
│   ├── gst/route.ts
│   └── dashboard/
│       └── stats/route.ts
├── components/
│   ├── DashboardNew.jsx (New role-based dashboard)
│   ├── SidebarNew.jsx (New role-based sidebar)
│   └── ... (other components)
├── login/
│   └── page.jsx (Login page)
└── dashboard/
    └── page.jsx (Dashboard page)

lib/
├── auth.ts (JWT & password utilities)
├── middleware.ts (Auth middleware)
├── prisma.ts (Prisma client)
└── validation.js (Data validation)

prisma/
├── schema.prisma (Database schema)
└── seed.ts (Demo data seeding)
```

---

## Common Issues & Solutions

### Issue: "Client not authenticated"
**Solution**: Check if token is being sent in `Authorization` header

### Issue: Database connection fails
**Solution**: Verify DATABASE_URL in .env.local is correct

### Issue: "Insufficient permissions"
**Solution**: Employee trying admin action. Check user role and endpoint restrictions

### Issue: Password hashing errors
**Solution**: Ensure bcryptjs is installed: `npm install bcryptjs`

### Issue: JWT errors
**Solution**: Check JWT_SECRET is set and token hasn't expired

---

## Security Best Practices

1. **Never commit secrets**
   ```bash
   # .gitignore
   .env
   .env.local
   ```

2. **Rotate JWT_SECRET**
   - Change in production
   - Use strong random string (32+ characters)

3. **Use HTTPS in Production**
   - All API calls should use HTTPS
   - Set NEXT_PUBLIC_API_URL to HTTPS URL

4. **Validate All Inputs**
   - Server-side validation on all routes
   - Use Prisma for SQL injection prevention

5. **Rate Limiting** (Future Enhancement)
   - Add rate limiting to auth endpoints
   - Prevent brute force attacks

6. **Secure Cookies** (Future Enhancement)
   - Move from localStorage to secure httpOnly cookies
   - Prevents XSS attacks

---

## Next Steps

1. ✅ Set up Neon PostgreSQL database
2. ✅ Configure environment variables
3. ✅ Install dependencies
4. ✅ Run migrations and seed demo data
5. ✅ Test login with demo credentials
6. ✅ Test API endpoints
7. 📋 **Next**: Build additional API endpoints for:
   - Payment management
   - ITR auto-fetch
   - File uploads
   - Email verification

---

## Support & Resources

- **Neon Docs**: https://neon.tech/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **JWT Guide**: https://jwt.io/introduction

---

**Setup Complete! 🎉**

Your CA Services backend is now ready for development and testing.
