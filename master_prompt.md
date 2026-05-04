You are a senior frontend engineer. Build a complete frontend-only web application using Next.js 15 (App Router) with Tailwind CSS and ShadCN UI.

The goal is to simulate a centralized transaction management system for a small CA/advocate firm that handles services like PAN, Aadhaar, RTI, TDS, ITR, etc.

This is NOT a backend-integrated system. Use static dummy data (JSON or JS file) to simulate the full workflow.

---

🎯 OBJECTIVE:
Create a clean, minimal, professional dashboard where:

* Admin (CA) can monitor all transactions
* Employees can log transactions
* System supports filtering, metrics, and drill-down views
* UI should feel modern but simple (avoid clutter)

---

🧠 USER ROLES:

1. Admin (CA / Advocate)

* Can view all transactions
* Can filter by employee, service, date, payment mode
* Can see analytics (revenue, counts, etc.)
* Can add transactions
* Can view employee performance

2. Employee

* Can add transactions
* Can view only their own transactions
* Limited analytics (personal stats only)

Simulate role switching using a toggle (no auth system needed)

---

📁 DATA (IMPORTANT)

Create a file: /data/transactions.js

Include:

* 4 employees:

  * Amit
  * Neha
  * Ravi
  * Pooja

* Services:

  * PAN Card
  * Aadhaar Update
  * RTI Filing
  * TDS Filing
  * ITR Filing

* Generate dummy transactions for 2 months:

  * ~40–60 records
  * Mix of:

    * payment modes: cash, UPI, bank
    * different employees
    * different services
    * random amounts (₹100–₹5000)
    * some expenses (optional)

Transaction structure:
{
id,
customerName,
phone,
service,
employee,
amountReceived,
amountPaid,
paymentMode,
date,
status,
notes
}

---

📊 DASHBOARD UI STRUCTURE

1. TOP METRICS (cards)

* Total Revenue (this month)
* Total Transactions
* Cash vs UPI vs Bank breakdown
* Pending vs Completed

2. MAIN TABLE (core component)
   Columns:

* Date
* Customer
* Service
* Employee
* Amount
* Payment Mode
* Status
* Action (view details modal)

3. FILTER BAR

* Date range picker
* Employee dropdown
* Service dropdown
* Payment mode filter
* Status filter

Filters should update table in real-time (client-side filtering)

---

➕ ADD TRANSACTION FEATURE

* Modal or slide-over form

* Fields:

  * Customer name
  * Phone
  * Service (dropdown)
  * Employee (auto-filled if employee role)
  * Amount received
  * Payment mode
  * Notes

* On submit:

  * Add to local state (no backend)
  * Immediately reflect in dashboard

---

👤 EMPLOYEE PERFORMANCE VIEW (Admin only)

* Show:

  * Revenue per employee
  * Number of transactions
  * Simple bar chart (use any lightweight chart lib or simple div bars)

---

📄 TRANSACTION DETAIL VIEW

* Click row → open modal
* Show full details:

  * customer info
  * service
  * employee
  * payment breakdown
  * notes

---

🎨 UI/UX REQUIREMENTS

* Use Tailwind + ShadCN components

* Clean spacing, avoid clutter

* Responsive (mobile-friendly)

* Sidebar layout:

  * Dashboard
  * Transactions
  * Employees (admin only)

* Keep colors neutral (professional CA office feel)

* Use cards, tables, badges

---

⚙️ TECH REQUIREMENTS

* Next.js 15 App Router
* Use React hooks for state
* No Redux (keep simple)
* Use local state or context for global state
* No backend calls

---

📦 FOLDER STRUCTURE

/app
/dashboard
/transactions
/components
/ui
/dashboard
/filters
/data
transactions.js
/lib
utils.js

---

🚫 DO NOT

* Do not over-engineer
* Do not add authentication
* Do not add unnecessary animations
* Do not use complex state management

---

✅ OUTPUT EXPECTATION

* Fully working frontend
* Dummy data-driven system
* Clean UI ready for demo
* Easy to extend later with backend

---

BONUS (if time allows):

* CSV export button
* Dark mode toggle
* Simple search bar (by customer name)

---

Think like you're building a real internal tool used daily by a CA office. Focus on usability and clarity over fancy design.
