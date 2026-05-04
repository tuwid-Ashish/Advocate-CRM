'use client';

import { useState, useMemo } from 'react';
import { transactions as initialTransactions } from '@/data/transactions';
import { MetricCard } from './MetricCard';
import { TransactionTable } from './TransactionTable';
import { FilterBar } from './FilterBar';
import { TransactionModal } from './TransactionModal';
import {
  PaymentModeChart,
  EmployeeRevenueChart,
  StatusBreakdownChart,
  ServiceCountChart,
} from './Charts';
import { EmployeesView } from './EmployeesView';
import { Sidebar } from './Sidebar';
import {
  calculateMetrics,
  formatCurrency,
  getEmployeeStats,
  getServiceStats,
} from '@/lib/utils';
import { Plus, TrendingUp, Zap, DollarSign, Menu } from 'lucide-react';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('admin');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [transactions] = useState(initialTransactions);

  const [filters, setFilters] = useState({
    employee: null,
    service: null,
    paymentMode: null,
    status: null,
    startDate: null,
    endDate: null,
  });

  const [dashboardDateRange, setDashboardDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // Filter transactions based on all filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filters.employee && t.employee !== filters.employee) return false;
      if (filters.service && t.service !== filters.service) return false;
      if (filters.paymentMode && t.paymentMode !== filters.paymentMode) return false;
      if (filters.status && t.status !== filters.status) return false;
      
      // Date range filter
      if (filters.startDate) {
        const txnDate = new Date(t.date);
        const startDate = new Date(filters.startDate);
        if (txnDate < startDate) return false;
      }
      if (filters.endDate) {
        const txnDate = new Date(t.date);
        const endDate = new Date(filters.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        if (txnDate > endDate) return false;
      }

      return true;
    });
  }, [transactions, filters]);

  // Get dashboard transactions based on dashboard date range
  const dashboardTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => {
      if (dashboardDateRange.startDate) {
        const txnDate = new Date(t.date);
        const startDate = new Date(dashboardDateRange.startDate);
        if (txnDate < startDate) return false;
      }
      if (dashboardDateRange.endDate) {
        const txnDate = new Date(t.date);
        const endDate = new Date(dashboardDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (txnDate > endDate) return false;
      }
      return true;
    });
  }, [filteredTransactions, dashboardDateRange]);

  const metrics = calculateMetrics(dashboardTransactions);
  const employeeStats = getEmployeeStats(dashboardTransactions);
  const serviceStats = getServiceStats(dashboardTransactions);

  const employees = [...new Set(transactions.map((t) => t.employee))];
  const services = [...new Set(transactions.map((t) => t.service))];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={userRole}
        onRoleChange={setUserRole}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                className="lg:hidden mt-1 p-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'transactions' && 'Transactions'}
                {activeTab === 'employees' && 'Employees'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {activeTab === 'dashboard' && 'Monitor your business metrics'}
                  {activeTab === 'transactions' && `View and manage all transactions (${filteredTransactions.length} results)`}
                  {activeTab === 'employees' && 'Track employee performance'}
                </p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Dashboard Date Filter */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Filter From Date</label>
                      <input
                        type="date"
                        value={dashboardDateRange.startDate || ''}
                        onChange={(e) => setDashboardDateRange({ ...dashboardDateRange, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Filter To Date</label>
                      <input
                        type="date"
                        value={dashboardDateRange.endDate || ''}
                        onChange={(e) => setDashboardDateRange({ ...dashboardDateRange, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setDashboardDateRange({ startDate: null, endDate: null })}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      >
                        Reset Date
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(metrics.totalRevenue)}
                    subtitle={`${dashboardTransactions.length} transactions`}
                    icon={DollarSign}
                  />
                  <MetricCard
                    title="Total Transactions"
                    value={metrics.totalCount}
                    subtitle={`Average: ${formatCurrency(metrics.totalCount > 0 ? metrics.totalRevenue / metrics.totalCount : 0)}`}
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Payment Breakdown"
                    value={metrics.paymentModeBreakdown.cash + metrics.paymentModeBreakdown.upi + metrics.paymentModeBreakdown.bank}
                    subtitle={`Cash: ${metrics.paymentModeBreakdown.cash}, UPI: ${metrics.paymentModeBreakdown.upi}`}
                    icon={Zap}
                  />
                  <MetricCard
                    title="Completed"
                    value={metrics.statusBreakdown.completed}
                    subtitle={`Pending: ${metrics.statusBreakdown.pending}`}
                    icon={TrendingUp}
                  />
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PaymentModeChart data={metrics.paymentModeBreakdown} />
                  <StatusBreakdownChart data={metrics.statusBreakdown} />
                  <EmployeeRevenueChart data={employeeStats} />
                  <ServiceCountChart data={serviceStats} />
                </div>

                {/* Latest Transactions */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
                  </div>
                  <TransactionTable
                    transactions={dashboardTransactions.slice(0, 10)}
                    onRowClick={setSelectedTransaction}
                  />
                </div>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">All Transactions</h1>
                  <p className="text-gray-600 mt-1">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </p>
                </div>

                <FilterBar
                  filters={filters}
                  onEmployeeChange={(emp) => setFilters({ ...filters, employee: emp })}
                  onServiceChange={(svc) => setFilters({ ...filters, service: svc })}
                  onStatusChange={(status) => setFilters({ ...filters, status })}
                  onPaymentModeChange={(mode) => setFilters({ ...filters, paymentMode: mode })}
                  onDateRangeChange={(dateType, value) => setFilters({ ...filters, [dateType]: value })}
                  employees={employees}
                  services={services}
                />

                <TransactionTable
                  transactions={filteredTransactions}
                  onRowClick={setSelectedTransaction}
                />
              </div>
            )}

            {activeTab === 'employees' && <EmployeesView employeeStats={employeeStats} />}
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />
    </div>
  );
};
