# 🚀 Quick Start Checklist - Neon + Backend Setup

Complete this checklist to get your CA Services application running with Neon PostgreSQL and role-based access.

---

## ✅ Prerequisites (5 minutes)

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Neon account created (https://console.neon.tech)
- [ ] VS Code or your favorite editor installed

---

## 📊 Step 1: Neon Database Setup (10 minutes)

1. [ ] Go to [Neon Console](https://console.neon.tech)
2. [ ] Sign up/login
3. [ ] Create new project:
   - [ ] Name: `ca-services-db`
   - [ ] Region: Closest to you
   - [ ] PostgreSQL: Latest version
4. [ ] Click **Create Project**
5. [ ] Copy the connection string:
   ```
   postgresql://user:password@host.aws.neon.tech/dbname?sslmode=require
   ```
6. [ ] Save it securely (you'll need it next)

---

## ⚙️ Step 2: Environment Configuration (5 minutes)

1. [ ] In your project root, create `.env.local` file
2. [ ] Add these variables:

```env
# Paste your Neon connection string here
DATABASE_URL="postgresql://user:password@host.aws.neon.tech/dbname?sslmode=require"

# JWT Secret - Change this to a random string
JWT_SECRET="your-random-secret-key-here-change-in-production"

# API Configuration
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

3. [ ] Save file
4. [ ] Verify `.gitignore` contains:
   ```
   .env
   .env.local
   .env.*.local
   ```

---

## 📦 Step 3: Install Dependencies (3 minutes)

```bash
# Run in terminal
npm install
```

Expected packages to install:
- [ ] @prisma/client
- [ ] prisma
- [ ] bcryptjs
- [ ] jsonwebtoken
- [ ] zod
- [ ] react-hook-form

---

## 🗄️ Step 4: Database Setup (5 minutes)

```bash
# Generate Prisma client
npx prisma generate

# Create database tables (migration)
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed
```

Expected output:
```
✨ Database seed completed successfully!
📝 Demo Credentials:
Admin: admin@example.com / admin123
Employee: amit@example.com / employee123
```

---

## 🧪 Step 5: Test Database Connection (2 minutes)

```bash
# Open Prisma Studio to verify data was created
npm run prisma:studio
```

- [ ] Browser opens to http://localhost:5555
- [ ] You can see tables:
  - [ ] Employee (with admin + 3 employees)
  - [ ] Client (with clients)
  - [ ] Service (with 7 services)
  - [ ] ServiceRecord (with demo records)

---

## 🚀 Step 6: Start Application (2 minutes)

```bash
# Start development server
npm run dev
```

Expected output:
```
> next dev

  ▲ Next.js 15.0.0
  - Local:        http://localhost:3000
```

- [ ] Server starts without errors
- [ ] No red error messages in terminal

---

## 🔑 Step 7: Test Login (5 minutes)

1. [ ] Open http://localhost:3000/login in browser
2. [ ] See login page with "CA Services" header
3. [ ] Test Admin Login:
   - [ ] Click **Admin Demo** button
   - [ ] Auto-fills: admin@example.com / admin123
   - [ ] Click **Sign In**
   - [ ] Redirected to /dashboard
4. [ ] Verify Admin Dashboard:
   - [ ] See "Welcome, Admin User"
   - [ ] See all 4 menu items: Dashboard, Records, Clients, Employees
   - [ ] See all charts (Payment, Status, Service)
   - [ ] See metrics cards
5. [ ] Test Logout:
   - [ ] Click Logout button in sidebar
   - [ ] Redirected to login page
6. [ ] Test Employee Login:
   - [ ] Click **Employee Demo** button
   - [ ] Auto-fills: amit@example.com / employee123
   - [ ] Click **Sign In**
7. [ ] Verify Employee Dashboard:
   - [ ] See "Welcome, Amit Kumar"
   - [ ] See only 2 menu items: Dashboard, Records
   - [ ] See NO charts (employee restricted)
   - [ ] See only assigned client records

---

## 📡 Step 8: Test API Endpoints (5 minutes)

Using any API client (Postman, Insomnia, or curl):

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Copy the token from response
```

```bash
# 2. Get Clients (replace TOKEN with token from above)
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer TOKEN"

# Should return list of clients
```

```bash
# 3. Get Dashboard Stats
curl -X GET http://localhost:3000/api/dashboard/stats \
  -H "Authorization: Bearer TOKEN"

# Should return metrics and breakdown
```

---

## ✨ Step 9: Verify File Structure (2 minutes)

Check that these files exist:

```
✓ .env.local (with your credentials)
✓ prisma/schema.prisma
✓ prisma/seed.ts
✓ app/api/auth/login/route.ts
✓ app/api/auth/register/route.ts
✓ app/api/clients/route.ts
✓ app/api/records/route.ts
✓ app/api/gst/route.ts
✓ app/api/dashboard/stats/route.ts
✓ app/components/DashboardNew.jsx
✓ app/components/SidebarNew.jsx
✓ app/login/page.jsx
✓ lib/auth.ts
✓ lib/middleware.ts
✓ lib/prisma.ts
✓ BACKEND_SETUP_GUIDE.md
```

---

## 📚 Documentation to Review

1. [ ] Read: `BACKEND_SETUP_GUIDE.md` - Complete setup details
2. [ ] Read: `CA_DATA_MODEL_DESIGN.md` - Data structure overview
3. [ ] Read: `IMPLEMENTATION_GUIDE.md` - How to build features

---

## 🎯 You're Done! Next Steps:

### Immediate (Today):
- [ ] Create more API endpoints for payment tracking
- [ ] Add file upload functionality
- [ ] Implement GST filing forms

### Short-term (This Week):
- [ ] Add email verification system
- [ ] Build employee management UI
- [ ] Create client creation forms

### Medium-term (Next 2 Weeks):
- [ ] Implement ITR auto-fetch from extension
- [ ] Add payment receipt management
- [ ] Create reporting/export features

---

## 🆘 Troubleshooting

### Problem: "Database connection failed"
```bash
# Solution: Verify DATABASE_URL
echo $DATABASE_URL
# Should output your Neon connection string

# Ensure Neon project is active (not suspended)
```

### Problem: "Cannot find module '@prisma/client'"
```bash
# Solution: Reinstall dependencies
npm install
npx prisma generate
```

### Problem: Login returns 401 Unauthorized
```bash
# Solution: Check email/password in database
npm run prisma:studio
# Go to Employee table, verify credentials
```

### Problem: API returns "Authorization: Bearer" error
```bash
# Solution: Ensure token is in Authorization header
# Format: Authorization: Bearer <YOUR_TOKEN>
# Not: Authorization: <YOUR_TOKEN>
```

---

## 🔒 Security Checklist

- [ ] Changed JWT_SECRET in .env.local
- [ ] Added .env.local to .gitignore
- [ ] Never share DATABASE_URL in code/git
- [ ] Verified passwords are hashed in database
- [ ] Tested role-based access works (employee can't access admin routes)

---

## 📊 Quick Command Reference

```bash
# Development
npm run dev                  # Start dev server
npm run prisma:studio       # Open database UI
npm run db:seed             # Seed demo data
npm run db:reset            # Reset database (deletes all data!)

# Database
npx prisma migrate dev      # Create new migration
npx prisma migrate status   # Check migration status

# Building
npm run build               # Build for production
npm start                   # Start production server
```

---

## ✅ Final Verification

- [ ] Can login as admin
- [ ] Can login as employee
- [ ] Admin sees all menu items
- [ ] Employee sees limited menu
- [ ] API endpoints return data with token
- [ ] No errors in browser console
- [ ] No errors in terminal
- [ ] Database has demo data

---

**🎉 If all checkboxes are checked, you're ready to develop!**

**Time to complete: ~45 minutes**

Next → Read BACKEND_SETUP_GUIDE.md for detailed information
