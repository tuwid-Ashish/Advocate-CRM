'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHotkeys } from '@/app/hooks/useHotkeys';
import { MetricCard } from '@/app/components/MetricCard';
import { TransactionTable } from '@/app/components/TransactionTable';
import { TransactionModal } from '@/app/components/TransactionModal';
import { AddRecordModal } from '@/app/components/AddRecordModal';
import { EditRecordModal } from '@/app/components/EditRecordModal';
import { AddClientModal } from '@/app/components/AddClientModal';
import { FilterBar } from '@/app/components/FilterBar';
import {
  PaymentModeChart,
  EmployeeRevenueChart,
  StatusBreakdownChart,
  ServiceCountChart,
} from '@/app/components/Charts';
import { EmployeesView } from '@/app/components/EmployeesView';
import { Sidebar } from '@/app/components/Sidebar';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  Plus,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Menu,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

const SERVICE_LABELS = {
  PAN: 'PAN',
  TAN: 'TAN',
  GST_3B: 'GST 3B',
  GST_1: 'GST 1',
  ITR: 'ITR',
  TDS: 'TDS',
  DSC: 'DSC',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'Processing',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const PAYMENT_LABELS = {
  CASH: 'Cash',
  UPI: 'UPI',
  CREDIT: 'Credit',
};

function buildServiceDetail(record) {
  const details = record.details || {};
  const itr = record.itrRecord || {};
  const payment = record.payment || {};
  const amount = Number(payment.amount || 0);
  const mode = PAYMENT_LABELS[payment.mode] || payment.mode || 'Cash';

  if (record.simpleDetail) {
    return `${record.simpleDetail.x || 'x'} from ${record.simpleDetail.y || 'y'} Rs ${amount} ${mode}`;
  }

  if (record.oneTimeDetail) {
    const { email, phone } = record.oneTimeDetail;
    return `Email: ${email || 'Not set'} | Phone: ${phone || 'Not set'}`;
  }

  if (record.gstFilings?.length) {
    const filing = record.gstFilings[0];
    const gstType = SERVICE_LABELS[filing.gstType] || filing.gstType || record.serviceType;
    return `${filing.partyName || 'Party'} - ${gstType} ${filing.month || ''} ${filing.year || ''}`.trim();
  }

  if (details.kind === 'SIMPLE_BUSINESS') {
    return `${details.x || 'x'} from ${details.y || 'y'} Rs ${amount} ${mode}`;
  }

  if (details.kind === 'GST') {
    const gstType = SERVICE_LABELS[details.gstType] || details.gstType || record.serviceType;
    return `${details.partyName || 'Party'} - ${gstType} ${details.month || ''} ${details.year || ''}`.trim();
  }

  if (details.kind === 'ONE_TIME') {
    return `Email: ${details.email || 'Not set'} | Phone: ${details.phone || 'Not set'}`;
  }

  if (record.serviceType === 'ITR') {
    const itrForm = itr.itrForm || details.itr_form || 'ITR';
    const ay = itr.financialYear || details.assessment_year || 'N/A';
    const filingStatus = itr.filingStatus || details.filing_status || 'Unknown';
    const filingDateRaw = itr.filingDate || details.filing_date || '';
    const filingDate = formatDateShort(filingDateRaw);
    const totalIncome = itr.grossTotalIncome || details.total_income;
    const taxPaid = itr.totalTaxPayable || details.tax_paid;

    const datePart = filingDate ? ` | Filed ${filingDate}` : '';
    const incomePart = totalIncome ? ` | Income ${totalIncome}` : '';
    const taxPart = taxPaid ? ` | Tax ${taxPaid}` : '';

    return `${itrForm} | AY ${ay} | ${filingStatus}${datePart}${incomePart}${taxPart}`;
  }

  return record.notes || '';
}

function mapRecordToTransaction(record) {
  const customer = record.client || {};
  const payment = record.payment || {};
  const customerName = customer.fullName || customer.businessName || customer.email || 'Unknown';
  const employeeName = record.createdBy?.name || 'Unknown';
  const amountReceived = Number(payment.amount || 0);
  const rawStatus = STATUS_LABELS[record.status] || record.status || 'Pending';
  const paymentMode = PAYMENT_LABELS[payment.mode] || payment.mode || 'Cash';

  return {
    id: record.id,
    date: record.createdAt,
    customerName,
    phone: customer.phone || customer.businessPhone || '',
    service: SERVICE_LABELS[record.serviceType] || record.serviceType || 'Service',
    employee: employeeName,
    amountReceived,
    amountPaid: amountReceived,
    paymentMode,
    status: rawStatus,
    serviceDetail: buildServiceDetail(record),
    notes: record.notes || '',
    record,
  };
}

function buildCounts(transactions, key) {
  return transactions.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

export const Dashboard = () => {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [token, setToken] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isBooting, setIsBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);

  // Refs for hotkey targets
  const searchInputRef = useRef(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: '',
    status: '',
    startDate: '',
    endDate: '',
    employeeId: '',
  });

  // Boot: load user from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenStr = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedSidebar = localStorage.getItem('sidebarCollapsed') === 'true';

    setTheme(savedTheme);
    setIsSidebarCollapsed(savedSidebar);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    if (!userStr || !tokenStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role?.toLowerCase() || '');
      setUserName(user.name || 'User');
      setToken(tokenStr);
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      router.push('/login');
    } finally {
      setIsBooting(false);
    }
  }, [router]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const recordParams = new URLSearchParams();
      recordParams.set('skip', '0');
      recordParams.set('take', '500');

      const requests = [
        fetch(`/api/records?${recordParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ];

      // If user is admin, fetch employees for filtering
      let fetchEmployees = false;
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role?.toLowerCase() === 'admin') {
          fetchEmployees = true;
          requests.push(
            fetch('/api/employees', {
              headers: { Authorization: `Bearer ${token}` },
            })
          );
        }
      }

      const responses = await Promise.all(requests);

      if (!responses[0].ok) throw new Error('Failed to fetch service records');
      if (!responses[1].ok) throw new Error('Failed to fetch clients');

      const recordData = await responses[0].json();
      const clientsData = await responses[1].json();

      setRecords(recordData.records || []);
      setClients(clientsData.clients || []);

      if (fetchEmployees && responses[2] && responses[2].ok) {
        const employeesData = await responses[2].json();
        setEmployees(employeesData.employees || []);
      }
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || isBooting) return;
    fetchDashboardData();
  }, [token, isBooting, fetchDashboardData]);

  // All transactions (unfiltered) — used for dashboard KPIs & charts
  const allTransactions = useMemo(() => records.map(mapRecordToTransaction), [records]);

  // Filtered transactions — used in the Service Records tab
  const transactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      // 1. Global search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          txn.customerName.toLowerCase().includes(q) ||
          txn.phone.toLowerCase().includes(q) ||
          txn.service.toLowerCase().includes(q) ||
          txn.notes.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Quick filter chips
      if (activeQuickFilter) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        switch (activeQuickFilter) {
          case 'today':
            if (new Date(txn.date) < todayStart) return false;
            break;
          case 'pending':
            if (txn.status !== 'Pending') return false;
            break;
          case 'this_week':
            if (new Date(txn.date) < weekAgo) return false;
            break;
          case 'gst':
            if (!txn.service.toUpperCase().includes('GST')) return false;
            break;
          case 'pan':
            if (!txn.service.toUpperCase().includes('PAN')) return false;
            break;
          case 'high_value':
            if (txn.amountReceived < 10000) return false;
            break;
        }
      }

      // 3. Advanced filters
      if (filters.serviceType && txn.record.serviceType !== filters.serviceType) return false;
      if (filters.status && txn.record.status !== filters.status) return false;
      if (filters.employeeId && txn.record.createdById !== filters.employeeId) return false;

      const createdAt = new Date(txn.date);
      if (filters.startDate) {
        const sDate = new Date(`${filters.startDate}T00:00:00`);
        if (createdAt < sDate) return false;
      }
      if (filters.endDate) {
        const eDate = new Date(`${filters.endDate}T23:59:59`);
        if (createdAt > eDate) return false;
      }

      return true;
    });
  }, [allTransactions, searchQuery, activeQuickFilter, filters]);

  // Dashboard KPI metrics
  const todayFilings = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return allTransactions.filter((t) => new Date(t.date) >= todayStart).length;
  }, [allTransactions]);

  const pendingPaymentsValue = useMemo(() => {
    return allTransactions
      .filter((t) => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amountReceived, 0);
  }, [allTransactions]);

  const completedThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allTransactions.filter(
      (t) => t.status === 'Completed' && new Date(t.date) >= weekAgo
    ).length;
  }, [allTransactions]);

  const overdueTasks = useMemo(() => {
    return allTransactions.filter((t) => {
      if (t.status === 'Completed' || t.status === 'Archived') return false;
      const dueDate = t.record.gstFilings?.[0]?.dueDate;
      if (dueDate) return new Date(dueDate) < new Date();
      return Date.now() - new Date(t.record.createdAt).getTime() > 5 * 24 * 60 * 60 * 1000;
    }).length;
  }, [allTransactions]);

  // Chart data
  const paymentModeBreakdown = useMemo(() => {
    const counts = buildCounts(allTransactions, 'paymentMode');
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allTransactions]);

  const statusBreakdown = useMemo(() => {
    const counts = buildCounts(allTransactions, 'status');
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allTransactions]);

  const serviceStats = useMemo(() => {
    const counts = buildCounts(allTransactions, 'service');
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allTransactions]);

  const employeeStats = useMemo(() => {
    const map = allTransactions.reduce((acc, txn) => {
      const emp = txn.employee;
      if (!acc[emp]) acc[emp] = { name: emp, revenue: 0, count: 0 };
      acc[emp].revenue += txn.amountReceived;
      acc[emp].count += 1;
      return acc;
    }, {});
    return Object.values(map);
  }, [allTransactions]);

  const dashboardTransactions = useMemo(() => allTransactions.slice(0, 10), [allTransactions]);

  // Keyboard shortcuts
  useHotkeys({
    '/': () => {
      setActiveTab('records');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    },
    'n': () => {
      if (activeTab === 'records') setIsAddRecordModalOpen(true);
    },
    'N': () => {
      if (activeTab === 'records') setIsAddRecordModalOpen(true);
    },
    'Escape': () => {
      setSelectedRecord(null);
      setIsAddRecordModalOpen(false);
      setIsAddClientModalOpen(false);
      setIsEditRecordModalOpen(false);
    },
    'b': (e) => {
      if (e.ctrlKey) {
        const newState = !isSidebarCollapsed;
        setIsSidebarCollapsed(newState);
        localStorage.setItem('sidebarCollapsed', newState);
      }
    }
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleEdit = (txn) => {
    setRecordToEdit(txn);
    setIsEditRecordModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isBooting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-950 text-gray-100' : 'bg-gray-50'}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        userName={userName}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => {
          const newState = !isSidebarCollapsed;
          setIsSidebarCollapsed(newState);
          localStorage.setItem('sidebarCollapsed', newState);
        }}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <div className={`border-b px-4 sm:px-6 lg:px-8 py-4 shadow-sm shrink-0 transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <button
                type="button"
                className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                onClick={() => {
                  const newState = !isSidebarCollapsed;
                  setIsSidebarCollapsed(newState);
                  localStorage.setItem('sidebarCollapsed', newState);
                }}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'records' && 'Service Records'}
                  {activeTab === 'clients' && 'Clients'}
                  {activeTab === 'employees' && 'Employees'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate dark:text-gray-400">
                  {activeTab === 'dashboard' && `Welcome back, ${userName}`}
                  {activeTab === 'records' && `${transactions.length} records shown`}
                  {activeTab === 'clients' && `${clients.length} clients`}
                  {activeTab === 'employees' && 'Employee performance overview'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {activeTab === 'records' && (
                <button
                  type="button"
                  onClick={() => setIsAddRecordModalOpen(true)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Record</span>
                </button>
              )}
              {activeTab === 'clients' && userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Client</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sticky FilterBar — only on records tab */}
        {activeTab === 'records' && (
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            onQuickFilter={setActiveQuickFilter}
            activeQuickFilter={activeQuickFilter}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            searchInputRef={searchInputRef}
            employees={employees}
            userRole={userRole}
          />
        )}

        {/* Main scrollable content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}
            {isLoading && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-600 text-sm">
                Refreshing data…
              </div>
            )}

            {/* ─── DASHBOARD TAB ─── */}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Today's Filings"
                    value={todayFilings}
                    subtitle="Records created today"
                    icon={ClipboardCheck}
                    trend="Operational"
                  />
                  <MetricCard
                    title="Pending Payments"
                    value={formatCurrency(pendingPaymentsValue)}
                    subtitle="Uncollected revenue"
                    icon={CreditCard}
                    variant="warning"
                  />
                  <MetricCard
                    title="Completed This Week"
                    value={completedThisWeek}
                    subtitle="Last 7 days"
                    icon={CheckCircle}
                    variant="success"
                  />
                  <MetricCard
                    title="Overdue Tasks"
                    value={overdueTasks}
                    subtitle="Needs immediate action"
                    icon={AlertTriangle}
                    variant="danger"
                  />
                </div>

                {userRole === 'admin' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PaymentModeChart data={paymentModeBreakdown} />
                    <StatusBreakdownChart data={statusBreakdown} />
                    <EmployeeRevenueChart data={employeeStats} />
                    <ServiceCountChart data={serviceStats} />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Service Records</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Latest {dashboardTransactions.length}
                    </span>
                  </div>
                  <TransactionTable
                    transactions={dashboardTransactions}
                    onRowClick={setSelectedRecord}
                    onEdit={handleEdit}
                  />
                </div>
              </>
            )}

            {/* ─── SERVICE RECORDS TAB ─── */}
            {activeTab === 'records' && (
              <TransactionTable
                transactions={transactions}
                onRowClick={setSelectedRecord}
                onEdit={handleEdit}
              />
            )}

            {/* ─── CLIENTS TAB ─── */}
            {activeTab === 'clients' && userRole === 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clients</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{clients.length} total</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                          <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Name</th>
                          <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email</th>
                          <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Records</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {clients.map((client) => (
                          <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                            <td className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                              {client.fullName || client.businessName || 'Unnamed'}
                            </td>
                            <td className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400">{client.email}</td>
                            <td className="px-6 py-2 text-sm">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  client.type === 'ONE_TIME_CUSTOMER'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                    : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                }`}
                              >
                                {client.type === 'ONE_TIME_CUSTOMER' ? 'One-Time' : 'Business'}
                              </span>
                            </td>
                            <td className="px-6 py-2 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                              {client.serviceRecords?.length || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── EMPLOYEES TAB ─── */}
            {activeTab === 'employees' && userRole === 'admin' && (
              <EmployeesView employeeStats={employeeStats} />
            )}

            {/* Access denied banners */}
            {activeTab === 'clients' && userRole !== 'admin' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
                You do not have access to the client directory.
              </div>
            )}
            {activeTab === 'employees' && userRole !== 'admin' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
                You do not have access to employee management.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedRecord && (
        <TransactionModal
          transaction={selectedRecord}
          onEdit={handleEdit}
          onClose={() => setSelectedRecord(null)}
        />
      )}
      <AddRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => setIsAddRecordModalOpen(false)}
        clients={clients}
        token={token}
        onSuccess={fetchDashboardData}
      />
      <EditRecordModal
        isOpen={isEditRecordModalOpen}
        onClose={() => setIsEditRecordModalOpen(false)}
        record={recordToEdit}
        clients={clients}
        token={token}
        onSuccess={fetchDashboardData}
      />

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        token={token}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
