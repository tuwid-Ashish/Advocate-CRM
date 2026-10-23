'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useHotkeys } from '@/app/hooks/useHotkeys';
import { MetricCard } from '@/app/components/MetricCard';
import { TransactionTable } from '@/app/components/TransactionTable';
import { TransactionModal } from '@/app/components/TransactionModal';
import { AddRecordModal } from '@/app/components/AddRecordModal';
import { EditRecordModal } from '@/app/components/EditRecordModal';
import { AddClientModal } from '@/app/components/AddClientModal';
import { EditClientModal } from '@/app/components/EditClientModal';
import { ClientDetailModal } from '@/app/components/ClientDetailModal';
import { EmployeesView } from '@/app/components/EmployeesView';
import { FilterBar } from '@/app/components/FilterBar';
import {
  PaymentModeChart,
  EmployeeRevenueChart,
  StatusBreakdownChart,
  ServiceCountChart,
} from '@/app/components/Charts';
import ApplicationsView from '@/app/components/ApplicationsView';
import { Sidebar } from '@/app/components/Sidebar';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  getCachedDashboardData,
  setCachedDashboardData,
  invalidateDashboardCache,
  getCacheAgeSeconds,
} from '@/lib/dashboardCache';
import {
  Plus,
  Download,
  RefreshCw,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Menu,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ArrowLeft,
  Info,
} from 'lucide-react';
// PanApplicationsView is rendered via ApplicationsView; avoid duplicate rendering

const SERVICE_LABELS = {
  PAN: 'PAN',
  TAN: 'TAN',
  GST_3B: 'GST 3B',
  GST_1: 'GST 1',
  ITR: 'ITR',
  TDS: 'TDS',
  DSC: 'DSC',
  EXTRA_EXPENSE: 'Extra Expense',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'Processing',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  COMPLETED: 'Paid',
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

  if (record.simpleDetail && record.serviceType !== 'ITR') {
    return `${record.simpleDetail.x || 'x'} from ${record.simpleDetail.y || 'y'} Rs ${amount} ${mode}`;
  }

  if (record.oneTimeDetail) {
    const { email, phone, reference } = record.oneTimeDetail;
    return `Email: ${email || 'Not set'} | Phone: ${phone || 'Not set'} | Reference: ${reference || 'Not set'}`;
  }

  if (record.gstFilings?.length) {
    const filing = record.gstFilings[0];
    const gstType = SERVICE_LABELS[filing.gstType] || filing.gstType || record.serviceType;
    return `${filing.partyName || 'Party'} - ${gstType} ${filing.month || ''} ${filing.year || ''}`.trim();
  }

  if (record.extraExpenseRecord) {
    const expense = record.extraExpenseRecord;
    const periodLabel = `${expense.month || ''} ${expense.year || ''}`.trim();
    const amountLabel = expense.amount ? ` | Rs ${expense.amount}` : '';
    const categoryLabel = expense.expenseCategory ? ` - ${expense.expenseCategory}` : '';
    return `${expense.expenseTitle || 'Expense'}${categoryLabel}${periodLabel ? ` | ${periodLabel}` : ''}${amountLabel}`;
  }

  if (details.kind === 'EXTRA_EXPENSE' || record.serviceType === 'EXTRA_EXPENSE') {
    const expenseAmount = details.amount || amount;
    const expenseLabel = details.expenseTitle || details.title || 'Expense';
    const categoryLabel = details.expenseCategory ? ` - ${details.expenseCategory}` : '';
    const periodLabel = `${details.month || ''} ${details.year || ''}`.trim();
    const amountLabel = expenseAmount ? ` | Rs ${expenseAmount}` : '';
    return `${expenseLabel}${categoryLabel}${periodLabel ? ` | ${periodLabel}` : ''}${amountLabel}`;
  }

  if (details.kind === 'SIMPLE_BUSINESS' && record.serviceType !== 'ITR') {
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

  if (record.serviceType === 'PAN' || record.serviceType === 'TAN') {
    const ack = details.ackNo || details.acknowledgmentNo || details.couponNo;
    const ackPart = ack ? `Ack: ${ack} | ` : '';
    return `${ackPart}Rs ${amount} ${mode}`;
  }

  return record.notes || '';
}

function mapRecordToTransaction(record) {
  const customer = record.client || {};
  const payment = record.payment || {};
  const customerName = customer.fullName || customer.businessName || customer.email || 'Unknown';
  const employeeName = record.assignment?.assignedName || record.createdBy?.name || 'Unknown';
  const amountReceived = Number(payment.amount || 0);
  const rawStatus = STATUS_LABELS[record.status] || record.status || 'Pending';
  const paymentStatusRaw = record.paymentStatus || payment.status || (amountReceived > 0 ? 'PAID' : 'PENDING');
  const paymentStatus = PAYMENT_STATUS_LABELS[paymentStatusRaw] || paymentStatusRaw || 'Pending';
  const paymentMode = PAYMENT_LABELS[payment.mode] || payment.mode || 'Cash';

  const customerEmail = customer.email || customer.businessEmail || customer.contactPersonEmail || record.oneTimeDetail?.email || record.details?.email || '';
  const customerPan = customer.panId || '';
  const customerGst = customer.gstId || '';
  const createdByEmail = record.createdBy?.email || '';

  return {
    id: record.id,
    date: record.createdAt,
    customerName,
    customerEmail,
    customerPan,
    customerGst,
    createdByEmail,
    phone: customer.phone || customer.businessPhone || '',
    service: SERVICE_LABELS[record.serviceType] || record.serviceType || 'Service',
    employee: employeeName,
    amountReceived,
    amountPaid: amountReceived,
    paymentMode,
    paymentStatus,
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

function toCsvValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/["]|,|\n/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildExportRows(transactions) {
  return transactions.map((txn) => {
    const record = txn.record || {};
    const details = record.details || {};
    const itr = record.itrRecord || {};
    const gst = record.gstFilings?.[0] || {};
    const expense = record.extraExpenseRecord || {};
    const oneTime = record.oneTimeDetail || {};
    const simple = record.simpleDetail || {};

    return {
      id: txn.id,
      createdDate: formatDateShort(txn.date),
      customerName: txn.customerName,
      phone: txn.phone,
      service: txn.service,
      status: txn.status,
      employee: txn.employee,
      paymentMode: txn.paymentMode,
      amountReceived: txn.amountReceived,
      notes: txn.notes,
      serviceDetail: txn.serviceDetail,
      itrForm: itr.itrForm || details.itr_form,
      assessmentYear: itr.financialYear || details.assessment_year,
      filingStatus: itr.filingStatus || details.filing_status,
      filingDate: formatDateShort(itr.filingDate || details.filing_date),
      totalIncome: itr.grossTotalIncome || details.total_income,
      taxPaid: itr.totalTaxPayable || details.tax_paid,
      refundStatus: details.refund_status,
      gstParty: gst.partyName || details.partyName,
      gstType: gst.gstType || details.gstType,
      gstMonth: gst.month || details.month,
      gstYear: gst.year || details.year,
      expenseTitle: expense.expenseTitle || details.expenseTitle,
      expenseCategory: expense.expenseCategory || details.expenseCategory,
      expenseMonth: expense.month || details.month,
      expenseYear: expense.year || details.year,
      expenseAmount: expense.amount || details.amount,
      paymentStatus: txn.paymentStatus,
      oneTimeEmail: oneTime.email || details.email,
      oneTimePhone: oneTime.phone || details.phone,
      simpleX: simple.x || details.x,
      simpleY: simple.y || details.y,
    };
  });
}

export const Dashboard = ({ initialTab = 'dashboard', onTabChange }) => {
  const router = useRouter();

  const [activeTab, setActiveTabState] = useState(initialTab);

  // setActiveTab may be overridden externally (by DashboardWithUrlSync) to also
  // update the URL. Otherwise it just updates local state.
  const setActiveTab = useCallback((tab, addHistory = true) => {
    setActiveTabState(tab);
    if (onTabChange) onTabChange(tab, addHistory);
  }, [onTabChange]);

  // Keep local state in sync when initialTab prop changes (browser back/forward
  // handled by the parent DashboardWithUrlSync updating this prop).
  useEffect(() => {
    setActiveTabState(initialTab);
  }, [initialTab]);
  const [userRole, setUserRole] = useState('');
  const [userName, setUserName] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isBooting, setIsBooting] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [cacheAgeSeconds, setCacheAgeSeconds] = useState(null);
  const [error, setError] = useState('');

  // Cache-age ticker — updates every 30 s so the UI stays accurate
  useEffect(() => {
    const id = setInterval(() => {
      const age = getCacheAgeSeconds();
      setCacheAgeSeconds(age);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [clientToEdit, setClientToEdit] = useState(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Clients tab: search box + internal per-client ledger view
  const [clientSearch, setClientSearch] = useState('');
  const [ledgerClient, setLedgerClient] = useState(null);
  const [ledgerSearch, setLedgerSearch] = useState('');

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

  const logoutAndRedirect = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      router.push('/login');
    }
  }, [router]);

  // Boot: load user from cookie session
  useEffect(() => {
    const loadSession = async () => {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const savedSidebar = localStorage.getItem('sidebarCollapsed') === 'true';

      setTheme(savedTheme);
      setIsSidebarCollapsed(savedSidebar);
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');

      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          await logoutAndRedirect();
          return;
        }

        const data = await response.json();
        const user = data.user || {};
        setUserRole(user.role?.toLowerCase() || '');
        setUserName(user.name || 'User');
        setIsSessionReady(true);
      } catch (e) {
        console.error('Failed to load session', e);
        await logoutAndRedirect();
      } finally {
        setIsBooting(false);
      }
    };

    loadSession();
  }, [logoutAndRedirect]);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    if (!isSessionReady) return;

    // ── Cache check ──────────────────────────────────────────────────
    if (!forceRefresh) {
      const { data, isFresh, isStale } = getCachedDashboardData();
      if (data) {
        // Immediately populate state from cache
        setRecords(data.records);
        setClients(data.clients);
        if (data.employees) setEmployees(data.employees);
        setCacheAgeSeconds(getCacheAgeSeconds());

        if (isFresh) {
          // Data is still fresh — skip network entirely
          return;
        }

        if (isStale) {
          // Show stale data immediately, revalidate in the background
          setIsBackgroundRefreshing(true);
          // fall through to fetch below (but don't block the UI)
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────

    if (!isBackgroundRefreshing) setIsLoading(true);
    setError('');

    try {
      const recordPageSize = 500;
      const fetchRecordPage = (skip) =>
        fetch(`/api/records?skip=${skip}&take=${recordPageSize}`);

      const requests = [fetch('/api/clients')];

      let fetchEmployees = false;
      if (userRole === 'admin') {
        fetchEmployees = true;
        requests.push(fetch('/api/employees'));
      }

      const firstRecordResponse = await fetchRecordPage(0);
      const responses = await Promise.all(requests);

      if (firstRecordResponse.status === 401 || responses.some(r => r.status === 401)) {
        await logoutAndRedirect();
        return;
      }

      if (!firstRecordResponse.ok) throw new Error('Failed to fetch service records');
      if (!responses[0].ok) throw new Error('Failed to fetch clients');

      const recordData = await firstRecordResponse.json();
      const clientsData = await responses[0].json();

      const totalPages = recordData.pagination?.pages || 1;
      const remainingRecordResponses = await Promise.all(
        Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
          fetchRecordPage((index + 1) * recordPageSize)
        )
      );

      for (const response of remainingRecordResponses) {
        if (response.status === 401) { await logoutAndRedirect(); return; }
        if (!response.ok) throw new Error('Failed to fetch service records');
      }

      const remainingRecordData = await Promise.all(
        remainingRecordResponses.map((r) => r.json())
      );

      const allRecords = [
        ...(recordData.records || []),
        ...remainingRecordData.flatMap((page) => page.records || []),
      ];

      let freshEmployees = employees;
      if (fetchEmployees && responses[1]?.ok) {
        const employeesData = await responses[1].json();
        freshEmployees = employeesData.employees || [];
        setEmployees(freshEmployees);
      }

      const freshClients = clientsData.clients || [];
      setRecords(allRecords);
      setClients(freshClients);

      // ── Write to cache ──────────────────────────────────────────────
      setCachedDashboardData({ records: allRecords, clients: freshClients, employees: freshEmployees });
      setCacheAgeSeconds(0);
      // ───────────────────────────────────────────────────────────────
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsBackgroundRefreshing(false);
    }
  }, [isSessionReady, userRole, logoutAndRedirect, employees, isBackgroundRefreshing]);

  useEffect(() => {
    if (!isSessionReady || isBooting) return;
    fetchDashboardData(false); // false = allow cache
  }, [isSessionReady, isBooting]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convenience: force-refresh + cache invalidation (used by the Refresh button and after mutations)
  const handleRefreshRecords = useCallback(() => {
    invalidateDashboardCache();
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Called after any mutation (add/edit/delete record or client) so stale data is evicted
  const handleDataMutated = useCallback(async () => {
    invalidateDashboardCache();
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  // All transactions (unfiltered) — used for dashboard KPIs & charts
  const allTransactions = useMemo(() => records.map(mapRecordToTransaction), [records]);

  // Filtered transactions — used in the Service Records tab
  const transactions = useMemo(() => {
    return allTransactions.filter((txn) => {
      // 1. Global search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (txn.customerName && txn.customerName.toLowerCase().includes(q)) ||
          (txn.customerEmail && txn.customerEmail.toLowerCase().includes(q)) ||
          (txn.phone && txn.phone.toLowerCase().includes(q)) ||
          (txn.service && txn.service.toLowerCase().includes(q)) ||
          (txn.employee && txn.employee.toLowerCase().includes(q)) ||
          (txn.createdByEmail && txn.createdByEmail.toLowerCase().includes(q)) ||
          (txn.customerPan && txn.customerPan.toLowerCase().includes(q)) ||
          (txn.customerGst && txn.customerGst.toLowerCase().includes(q)) ||
          (txn.serviceDetail && txn.serviceDetail.toLowerCase().includes(q)) ||
          (txn.notes && txn.notes.toLowerCase().includes(q)) ||
          (txn.id && txn.id.toLowerCase().includes(q));
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
          case 'pending_payment': {
            // Records where payment has not been fully received
            const ps = (txn.paymentStatus || '').toLowerCase();
            if (!ps.includes('pending') && !ps.includes('partial')) return false;
            break;
          }
          case 'overdue': {
            // Not completed/archived AND older than 5 days OR past its due date
            if (txn.status === 'Completed' || txn.status === 'Archived') return false;
            const dueDate = txn.record.gstFilings?.[0]?.dueDate;
            if (dueDate) {
              if (new Date(dueDate) >= new Date()) return false;
            } else {
              if (Date.now() - new Date(txn.record.createdAt).getTime() <= 5 * 24 * 60 * 60 * 1000) return false;
            }
            break;
          }
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

  const recordsPageCount = Math.max(1, Math.ceil(transactions.length / recordsPerPage));
  const activeRecordsPage = Math.min(recordsPage, recordsPageCount);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (activeRecordsPage - 1) * recordsPerPage;
    return transactions.slice(startIndex, startIndex + recordsPerPage);
  }, [transactions, activeRecordsPage, recordsPerPage]);

  useEffect(() => {
    setRecordsPage((currentPage) => {
      const nextPageCount = Math.max(1, Math.ceil(transactions.length / recordsPerPage));
      return Math.min(currentPage, nextPageCount);
    });
  }, [transactions.length, recordsPerPage]);

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

  // ── Clients tab: searchable client directory ──────────────────────────
  const filteredClients = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((client) => {
      const fields = [
        client.fullName,
        client.businessName,
        client.email,
        client.businessEmail,
        client.phone,
        client.businessPhone,
        client.contactPersonName,
        client.contactPersonPhone,
        client.contactPersonEmail,
        client.panId,
        client.gstId,
      ];
      return fields.some((value) => value && String(value).toLowerCase().includes(q));
    });
  }, [clients, clientSearch]);

  // ── Internal per-client ledger view ───────────────────────────────────
  // All transactions that belong to the selected client (matched by clientId).
  const ledgerTransactions = useMemo(() => {
    if (!ledgerClient) return [];
    const clientId = ledgerClient.id;
    const base = allTransactions.filter((txn) => {
      const recordClientId = txn.record?.clientId || txn.record?.client?.id;
      return recordClientId === clientId;
    });

    const q = ledgerSearch.toLowerCase().trim();
    if (!q) return base;
    return base.filter((txn) =>
      [
        txn.service,
        txn.employee,
        txn.serviceDetail,
        txn.notes,
        txn.status,
        txn.paymentStatus,
        txn.paymentMode,
        txn.id,
      ].some((value) => value && String(value).toLowerCase().includes(q))
    );
  }, [ledgerClient, allTransactions, ledgerSearch]);

  // Total amount received across the selected client's ledger
  const ledgerTotal = useMemo(
    () => ledgerTransactions.reduce((sum, txn) => sum + txn.amountReceived, 0),
    [ledgerTransactions]
  );

  // Leaving the Clients tab closes any open ledger view
  useEffect(() => {
    if (activeTab !== 'clients') {
      setLedgerClient(null);
      setLedgerSearch('');
    }
  }, [activeTab]);

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

  const handleOpenClient = (client) => {
    setSelectedClient(client);
  };

  const handleEditClient = (client) => {
    setClientToEdit(client);
    setIsEditClientModalOpen(true);
    setSelectedClient(null);
  };

  /**
   * Navigate to records tab with a pre-applied filter for the given metric.
   * metricType: 'today_filings' | 'pending_payments' | 'completed_week' | 'overdue'
   */
  const handleMetricClick = (metricType) => {
    // Clear existing filters first
    setSearchQuery('');
    setFilters({ serviceType: '', status: '', startDate: '', endDate: '', employeeId: '' });
    setActiveTab('records');

    switch (metricType) {
      case 'today_filings':
        setActiveQuickFilter('today');
        break;
      case 'pending_payments':
        setActiveQuickFilter('pending_payment');
        break;
      case 'completed_week':
        setActiveQuickFilter('this_week');
        // Also restrict to completed status
        setFilters((prev) => ({ ...prev, status: 'COMPLETED' }));
        break;
      case 'overdue':
        setActiveQuickFilter('overdue');
        break;
      default:
        setActiveQuickFilter(null);
    }
  };

  const handleLogout = () => {
    logoutAndRedirect();
  };

  // Shared CSV export — used by the Service Records tab and the per-client ledger
  const exportTransactionsToCsv = (txns, filename) => {
    const rows = buildExportRows(txns);
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    rows.forEach((row) => {
      const line = headers.map((key) => toCsvValue(row[key])).join(',');
      csvLines.push(line);
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadRecords = () => {
    exportTransactionsToCsv(transactions, `service-records-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Open a client's internal ledger view (filtered records + download)
  const handleOpenLedger = (client) => {
    setLedgerSearch('');
    setLedgerClient(client);
  };

  // Download only the selected client's ledger
  const handleDownloadLedger = () => {
    if (!ledgerClient) return;
    const name = ledgerClient.fullName || ledgerClient.businessName || 'client';
    const safeName = name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
    exportTransactionsToCsv(ledgerTransactions, `ledger-${safeName || 'client'}-${new Date().toISOString().slice(0, 10)}.csv`);
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
                  {activeTab === 'applications' && 'Application Records'}
                  {activeTab === 'clients' && 'Clients'}
                  {activeTab === 'employees' && 'Employees'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate dark:text-gray-400">
                  {activeTab === 'dashboard' && `Welcome back, ${userName}`}
                  {activeTab === 'records' && `${transactions.length} records shown`}
                  {activeTab === 'applications' && 'PAN, TAN, and PTDS application tracking'}
                  {activeTab === 'clients' && (ledgerClient ? `Ledger for ${ledgerClient.fullName || ledgerClient.businessName || 'client'}` : `${clients.length} clients`)}
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
                <div className="flex items-center gap-1.5">
                  {isBackgroundRefreshing && (
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium hidden sm:block animate-pulse">
                      Syncing…
                    </span>
                  )}
                  {!isLoading && !isBackgroundRefreshing && cacheAgeSeconds !== null && (
                    <span
                      className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block"
                      title="Age of cached data — click Refresh to force a new fetch"
                    >
                      {cacheAgeSeconds < 60
                        ? 'Just updated'
                        : cacheAgeSeconds < 3600
                        ? `${Math.floor(cacheAgeSeconds / 60)}m ago`
                        : `${Math.floor(cacheAgeSeconds / 3600)}h ago`}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRefreshRecords}
                    disabled={isLoading || isBackgroundRefreshing}
                    className="border border-gray-200 text-gray-600 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Force a fresh fetch from the database"
                  >
                    <RefreshCw className={`w-4 h-4 ${(isLoading || isBackgroundRefreshing) ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              )}

              {activeTab === 'records' && (
                <button
                  type="button"
                  onClick={handleDownloadRecords}
                  className="border border-gray-200 text-gray-600 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              )}

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
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-blue-600 text-sm dark:border-blue-900/30 dark:bg-blue-900/10 dark:text-blue-400">
                Loading data…
              </div>
            )}
            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Today's Filings"
                    value={todayFilings}
                    subtitle="Records created today"
                    icon={ClipboardCheck}
                    onClick={() => handleMetricClick('today_filings')}
                  />
                  <MetricCard
                    title="Pending Payments"
                    value={formatCurrency(pendingPaymentsValue)}
                    subtitle="Uncollected revenue"
                    icon={CreditCard}
                    variant="warning"
                    onClick={() => handleMetricClick('pending_payments')}
                  />
                  <MetricCard
                    title="Completed This Week"
                    value={completedThisWeek}
                    subtitle="Last 7 days"
                    icon={CheckCircle}
                    variant="success"
                    onClick={() => handleMetricClick('completed_week')}
                  />
                  <MetricCard
                    title="Overdue Tasks"
                    value={overdueTasks}
                    subtitle="Needs immediate action"
                    icon={AlertTriangle}
                    variant="danger"
                    onClick={() => handleMetricClick('overdue')}
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

          {activeTab === 'records' && (
            <>
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Service Records</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Showing {transactions.length === 0 ? 0 : (activeRecordsPage - 1) * recordsPerPage + 1}-{Math.min(activeRecordsPage * recordsPerPage, transactions.length)} of {transactions.length}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="whitespace-nowrap">Rows per page</span>
                      <select
                        value={recordsPerPage}
                        onChange={(e) => {
                          setRecordsPerPage(Number(e.target.value));
                          setRecordsPage(1);
                        }}
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRecordsPage((page) => Math.max(1, page - 1))}
                        disabled={activeRecordsPage === 1 || transactions.length === 0}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                        Page {transactions.length === 0 ? 0 : activeRecordsPage} of {transactions.length === 0 ? 0 : recordsPageCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRecordsPage((page) => Math.min(recordsPageCount, page + 1))}
                        disabled={activeRecordsPage >= recordsPageCount || transactions.length === 0}
                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
                <TransactionTable
                  transactions={paginatedTransactions}
                  onRowClick={setSelectedRecord}
                  onEdit={handleEdit}
                />
              </div>
            </>
          )}

          {activeTab === 'applications' && userRole === 'admin' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Application Records</h1>
              <ApplicationsView />
            </>
          )}

          {activeTab === 'clients' && userRole === 'admin' && ledgerClient && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setLedgerClient(null)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Clients
              </button>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {ledgerClient.fullName || ledgerClient.businessName || 'Unnamed'} — Ledger
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {ledgerTransactions.length} records · Total received {formatCurrency(ledgerTotal)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={ledgerSearch}
                      onChange={(e) => setLedgerSearch(e.target.value)}
                      placeholder="Search this ledger…"
                      className="pl-9 pr-3 py-2 w-full sm:w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenClient(ledgerClient)}
                    className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Info className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadLedger}
                    disabled={ledgerTransactions.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Download Ledger
                  </button>
                </div>
              </div>

              <TransactionTable
                transactions={ledgerTransactions}
                onRowClick={setSelectedRecord}
                onEdit={handleEdit}
              />
            </div>
          )}

          {activeTab === 'clients' && userRole === 'admin' && !ledgerClient && (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clients</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {clientSearch.trim() ? `${filteredClients.length} of ${clients.length}` : `${clients.length} total`}
                    </span>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search name, email, phone, PAN, GST…"
                      className="pl-9 pr-3 py-2 w-full sm:w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
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
                        {filteredClients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              No clients match your search.
                            </td>
                          </tr>
                        )}
                        {filteredClients.map((client) => (
                          <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer" onClick={() => handleOpenLedger(client)}>
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


           {activeTab === 'employees' && userRole === 'admin' && (
             <>
               {/* <h1 className="text-2xl font-bold mb-6">Employees</h1> */}
              <EmployeesView
                employeeStats={employeeStats}
                employees={employees}
                allTransactions={allTransactions}
                onRefresh={handleDataMutated}
              />
             </>
           )}

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
          {activeTab === 'applications' && userRole !== 'admin' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 text-sm">
              You do not have access to application records.
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Applications view is rendered inside the main content area via <ApplicationsView /> */}

      {/* Modals */}
      {selectedRecord && (
        <TransactionModal
          transaction={selectedRecord}
          onEdit={handleEdit}
          onClose={() => setSelectedRecord(null)}
        />
      )}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => handleEditClient(selectedClient)}
        />
      )}
      <AddRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => setIsAddRecordModalOpen(false)}
        clients={clients}
        onSuccess={handleDataMutated}
      />
      <EditRecordModal
        isOpen={isEditRecordModalOpen}
        onClose={() => setIsEditRecordModalOpen(false)}
        record={recordToEdit}
        clients={clients}
        onSuccess={handleDataMutated}
      />

      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => {
          setIsAddClientModalOpen(false);
        }}
        onSuccess={handleDataMutated}
      />
      <EditClientModal
        isOpen={isEditClientModalOpen}
        onClose={() => {
          setIsEditClientModalOpen(false);
          setClientToEdit(null);
        }}
        client={clientToEdit}
        onSuccess={handleDataMutated}
        onDelete={handleDataMutated}
      />
    </div>
  );
};

/**
 * DashboardWithUrlSync
 *
 * Thin wrapper that owns useSearchParams / usePathname so that the core
 * Dashboard component never calls those hooks directly. This means only this
 * wrapper needs to live inside a <Suspense> boundary — the pages provide that
 * via the DashboardPage component.
 *
 * URL contract:  /dashboard?tab=records
 *   - Tab changes  → router.push  (adds a history entry → back button works)
 *   - Filter-only  → router.replace (no history entry)
 */
export function DashboardWithUrlSync({ initialTab = 'dashboard' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive the active tab from the URL, falling back to the prop
  const urlTab = searchParams.get('tab');
  const [currentTab, setCurrentTab] = useState(urlTab || initialTab);

  // When the URL changes (browser back / forward), sync local state
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== currentTab) {
      setCurrentTab(tab);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Callback passed to Dashboard so it can update the URL on tab change
  const handleTabChange = useCallback((tab, addHistory = true) => {
    setCurrentTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    const newUrl = `${pathname}?${params.toString()}`;
    if (addHistory) {
      router.push(newUrl, { scroll: false });
    } else {
      router.replace(newUrl, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  return <Dashboard initialTab={currentTab} onTabChange={handleTabChange} />;
}
