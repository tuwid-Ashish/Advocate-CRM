'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricCard } from '@/app/components/MetricCard';
import { TransactionTable } from '@/app/components/TransactionTable';
import { TransactionModal } from '@/app/components/TransactionModal';
import { AddRecordModal } from '@/app/components/AddRecordModal';
import { AddClientModal } from '@/app/components/AddClientModal';
import {
  PaymentModeChart,
  EmployeeRevenueChart,
  StatusBreakdownChart,
  ServiceCountChart,
} from '@/app/components/Charts';
import { EmployeesView } from '@/app/components/EmployeesView';
import { Sidebar } from '@/app/components/Sidebar';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  TrendingUp,
  Zap,
  DollarSign,
  Menu,
  Users,
  FileText,
  PieChart,
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
  const payment = record.payment || {};
  const amount = Number(payment.amount || 0);
  const mode = PAYMENT_LABELS[payment.mode] || payment.mode || 'Cash';

  if (record.simpleDetail) {
    return `${record.simpleDetail.x || 'x'} from ${record.simpleDetail.y || 'y'} Rs ${amount} ${mode}`;
  }

  if (record.oneTimeDetail) {
    return `Email: ${record.oneTimeDetail.email || 'Not set'}`;
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
    return `Email: ${details.email || 'Not set'}`;
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
  const [isBooting, setIsBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    serviceType: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (!savedUser || !savedToken) {
      router.replace('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      setUserName(parsedUser.name || 'User');
      setUserRole((parsedUser.role || 'employee').toLowerCase());
      setToken(savedToken);
      setIsBooting(false);
    } catch (parseError) {
      console.error('Failed to parse saved user session:', parseError);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.replace('/login');
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

      const recordResponse = await fetch(`/api/records?${recordParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!recordResponse.ok) {
        throw new Error('Failed to fetch service records');
      }

      const recordData = await recordResponse.json();
      setRecords(recordData.records || []);

      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const statsData = await statsResponse.json();
      setStats(statsData);

      const clientsResponse = await fetch('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients');
      }

      const clientsData = await clientsResponse.json();
      setClients(clientsData.clients || []);
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

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filters.serviceType && record.serviceType !== filters.serviceType) return false;
      if (filters.status && record.status !== filters.status) return false;

      const createdAt = new Date(record.createdAt);

      if (filters.startDate) {
        const startDate = new Date(`${filters.startDate}T00:00:00`);
        if (createdAt < startDate) return false;
      }

      if (filters.endDate) {
        const endDate = new Date(`${filters.endDate}T23:59:59`);
        if (createdAt > endDate) return false;
      }

      return true;
    });
  }, [filters, records]);

  const allTransactions = useMemo(() => records.map(mapRecordToTransaction), [records]);
  const transactions = useMemo(() => filteredRecords.map(mapRecordToTransaction), [filteredRecords]);

  const dashboardTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  const paymentModeBreakdown = useMemo(() => {
    const counts = buildCounts(transactions, 'paymentMode');
    return {
      cash: counts.Cash || 0,
      upi: counts.UPI || 0,
      bank: counts.Credit || 0,
    };
  }, [transactions]);

  const statusBreakdown = useMemo(() => {
    const counts = buildCounts(transactions, 'status');
    return {
      completed: counts.Completed || 0,
      pending: counts.Pending || 0,
      processing: counts.Processing || 0,
    };
  }, [transactions]);

  const employeeStats = useMemo(() => {
    const statsMap = {};

    transactions.forEach((transaction) => {
      if (!statsMap[transaction.employee]) {
        statsMap[transaction.employee] = {
          name: transaction.employee,
          revenue: 0,
          count: 0,
        };
      }

      statsMap[transaction.employee].revenue += transaction.amountReceived;
      statsMap[transaction.employee].count += 1;
    });

    return Object.values(statsMap).sort((left, right) => right.revenue - left.revenue);
  }, [transactions]);

  const serviceStats = useMemo(() => {
    const statsMap = {};

    transactions.forEach((transaction) => {
      if (!statsMap[transaction.service]) {
        statsMap[transaction.service] = {
          name: transaction.service,
          revenue: 0,
          count: 0,
        };
      }

      statsMap[transaction.service].revenue += transaction.amountReceived;
      statsMap[transaction.service].count += 1;
    });

    return Object.values(statsMap).sort((left, right) => right.count - left.count);
  }, [transactions]);

  const metrics = stats?.metrics || {};
  const totalRecords = metrics.totalRecords ?? allTransactions.length;
  const totalRevenue = metrics.totalRevenue ?? allTransactions.reduce((sum, item) => sum + item.amountReceived, 0);
  const completedRecords = metrics.completedRecords ?? allTransactions.filter((item) => item.status === 'Completed').length;
  const pendingRecords = metrics.pendingRecords ?? allTransactions.filter((item) => item.status === 'Pending').length;
  const inProgressRecords = metrics.inProgressRecords ?? allTransactions.filter((item) => item.status === 'Processing').length;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleDateChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  if (isBooting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        userName={userName}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden mt-1 p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'records' && 'Service Records'}
                  {activeTab === 'clients' && 'Clients'}
                  {activeTab === 'employees' && 'Employees'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                  {activeTab === 'dashboard' && `Welcome, ${userName}`}
                  {activeTab === 'records' && `Track and manage service records (${transactions.length} shown)`}
                  {activeTab === 'clients' && `Client directory (${clients.length})`}
                  {activeTab === 'employees' && 'Monitor employee performance'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'records' && (
                <button
                  type="button"
                  onClick={() => setIsAddRecordModalOpen(true)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add Record</span>
                </button>
              )}

              {activeTab === 'clients' && userRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Add Client</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700">
                Refreshing dashboard data...
              </div>
            )}

            {activeTab === 'dashboard' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Records"
                    value={totalRecords}
                    subtitle={userRole === 'admin' ? 'Across the full firm' : 'Your assigned workload'}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    subtitle={`${dashboardTransactions.length} recent records`}
                    icon={DollarSign}
                  />
                  <MetricCard
                    title="Completed"
                    value={completedRecords}
                    subtitle={`Pending: ${pendingRecords}`}
                    icon={Zap}
                  />
                  <MetricCard
                    title="In Progress"
                    value={inProgressRecords}
                    subtitle={userRole === 'admin' ? 'All active filings' : 'Your active records'}
                    icon={PieChart}
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
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold text-gray-900">Recent Service Records</h2>
                    <span className="text-sm text-gray-500">Showing the latest {dashboardTransactions.length}</span>
                  </div>
                  <TransactionTable
                    transactions={dashboardTransactions}
                    onRowClick={setSelectedRecord}
                  />
                </div>
              </>
            )}

            {activeTab === 'records' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Service Type</label>
                      <select
                        value={filters.serviceType}
                        onChange={(e) => setFilters((current) => ({ ...current, serviceType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Services</option>
                        {Object.keys(SERVICE_LABELS).map((serviceType) => (
                          <option key={serviceType} value={serviceType}>
                            {SERVICE_LABELS[serviceType]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                      <select
                        value={filters.status}
                        onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">Processing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFilters({
                          serviceType: '',
                          status: '',
                          startDate: '',
                          endDate: '',
                        })
                      }
                      className="px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition-colors"
                    >
                      Reset Filters
                    </button>
                    <p className="text-sm text-gray-500">Filters use cached records loaded on this page.</p>
                  </div>
                </div>

                <TransactionTable transactions={transactions} onRowClick={setSelectedRecord} />
              </div>
            )}

            {activeTab === 'clients' && userRole === 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-gray-900">Clients</h2>
                  <span className="text-sm text-gray-500">{clients.length} total</span>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Records</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((client) => (
                          <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {client.fullName || client.businessName || 'Unnamed'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{client.email}</td>
                            <td className="px-6 py-4 text-sm">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  client.type === 'ONE_TIME_CUSTOMER'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {client.type === 'ONE_TIME_CUSTOMER' ? 'One-Time' : 'Business'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
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
              <EmployeesView employeeStats={employeeStats} />
            )}

            {activeTab === 'clients' && userRole !== 'admin' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                You do not have access to the client directory.
              </div>
            )}

            {activeTab === 'employees' && userRole !== 'admin' && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                You do not have access to employee management.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRecord && (
        <TransactionModal transaction={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      <AddRecordModal
        isOpen={isAddRecordModalOpen}
        onClose={() => setIsAddRecordModalOpen(false)}
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
