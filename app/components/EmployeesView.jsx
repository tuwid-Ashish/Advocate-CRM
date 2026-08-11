'use client';

import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, ChevronRight, Mail, History } from 'lucide-react';
import { EmployeeDetailView } from './EmployeeDetailView';
import { ReassignEmployeeModal } from './ReassignEmployeeModal';

export const EmployeesView = ({
  employeeStats = [],
  employees = [],
  allTransactions = [],
  onRefresh,
}) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [reassignAccount, setReassignAccount] = useState(null);

  // Build grid cards — EXACTLY 1 card per permanent Employee Account (showing current active employee)
  const cardsData = useMemo(() => {
    if (employees && employees.length > 0) {
      return employees.map((emp) => {
        const activeAssignment = emp.assignments?.find((a) => a.isCurrent) || emp.assignments?.[0];
        const activeAssignedName = activeAssignment?.assignedName || emp.name;
        const accountEmail = emp.accountEmail || emp.email;

        // Calculate account-wide metrics across all transactions
        const accountRecords = allTransactions.filter((txn) => {
          const rec = txn.record;
          if (!rec) return false;

          return (
            rec.createdById === emp.id ||
            (accountEmail && rec.createdBy?.email?.toLowerCase() === accountEmail.toLowerCase()) ||
            (emp.name && rec.createdBy?.name?.toLowerCase() === emp.name.toLowerCase()) ||
            (emp.assignments &&
              emp.assignments.some(
                (a) => a.assignedName?.toLowerCase() === txn.employee?.toLowerCase()
              ))
          );
        });

        const totalCount = accountRecords.length;
        const totalRevenue = accountRecords.reduce((sum, t) => sum + (t.amountReceived || 0), 0);

        return {
          id: emp.id,
          name: activeAssignedName,
          accountEmail: accountEmail || `${emp.name.toLowerCase()}@domain.com`,
          count: totalCount || emp.totalAccountMetrics?.count || 0,
          revenue: totalRevenue || emp.totalAccountMetrics?.revenue || 0,
          assignments: emp.assignments || [
            {
              id: 'default',
              assignedName: activeAssignedName,
              startDate: emp.createdAt || new Date('2024-01-01'),
              isCurrent: true,
            },
          ],
          fullEmp: emp,
        };
      });
    }

    // Fallback if employees API is not loaded yet
    const accountMap = new Map();
    employeeStats.forEach((stat) => {
      const key = stat.id || stat.name;
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          id: stat.id || stat.name,
          name: stat.name,
          accountEmail: `${stat.name.toLowerCase()}@domain.com`,
          count: stat.count || 0,
          revenue: stat.revenue || 0,
          assignments: [
            {
              id: 'default',
              assignedName: stat.name,
              startDate: new Date('2024-01-01'),
              isCurrent: true,
            },
          ],
          fullEmp: null,
        });
      }
    });

    return Array.from(accountMap.values());
  }, [employees, employeeStats, allTransactions]);

  const handleCardClick = (card) => {
    const mergedAccount = {
      ...card,
      ...(card.fullEmp || {}),
      id: card.fullEmp?.id || card.id,
      name: card.fullEmp?.name || card.name,
      accountEmail: card.fullEmp?.accountEmail || card.fullEmp?.email || card.accountEmail,
      assignments: card.fullEmp?.assignments || card.assignments,
    };
    setSelectedAccount(mergedAccount);
  };

  const handleReassignSuccess = () => {
    if (onRefresh) onRefresh();
    setSelectedAccount(null);
  };

  // Dedicated Full Page View for Selected Account Details
  if (selectedAccount) {
    return (
      <div className="space-y-6">
        <EmployeeDetailView
          employeeAccount={selectedAccount}
          allTransactions={allTransactions}
          onBack={() => setSelectedAccount(null)}
          onOpenReassign={(emp) => setReassignAccount(emp)}
        />

        {/* Reassign Account Modal */}
        {reassignAccount && (
          <ReassignEmployeeModal
            isOpen={!!reassignAccount}
            onClose={() => setReassignAccount(null)}
            employeeAccount={reassignAccount}
            onSuccess={handleReassignSuccess}
          />
        )}
      </div>
    );
  }

  // Employee Performance Cards Grid View (1 Card Per Employee Account)
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Employee Performance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Monitor revenue and transaction metrics by employee account. Click any account to view detailed performance &amp; assignment history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cardsData.map((emp) => {
          const assignmentCount = emp.assignments?.length || 1;

          return (
            <div
              key={emp.id}
              onClick={() => handleCardClick(emp)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono mb-1 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                      <span className="truncate">{emp.accountEmail}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {emp.name}
                    </h3>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
                      {emp.count}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                      Transactions
                    </p>
                  </div>

                  <div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums tracking-tight break-words">
                      {formatCurrency(emp.revenue)}
                    </p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                      Total Revenue
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                  <History className="w-3 h-3 text-purple-500" />
                  <span>{assignmentCount} {assignmentCount === 1 ? 'Assignment' : 'Assignments'}</span>
                </span>

                <span className="text-blue-600 dark:text-blue-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>

      {/* Reassign Account Modal */}
      {reassignAccount && (
        <ReassignEmployeeModal
          isOpen={!!reassignAccount}
          onClose={() => setReassignAccount(null)}
          employeeAccount={reassignAccount}
          onSuccess={handleReassignSuccess}
        />
      )}
    </div>
  );
};
