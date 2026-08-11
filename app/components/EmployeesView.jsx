'use client';

import { useState } from 'react';
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

  // Map employee stats to full employee accounts if available
  const cardsData = employeeStats.map((stat) => {
    // Find matching employee by name or id
    const fullEmp = employees.find(
      (e) =>
        e.id === stat.id ||
        e.name?.toLowerCase() === stat.name?.toLowerCase() ||
        e.accountEmail?.toLowerCase() === stat.name?.toLowerCase() ||
        e.currentAssignment?.assignedName?.toLowerCase() === stat.name?.toLowerCase()
    );

    return {
      id: fullEmp?.id || stat.id || stat.name,
      name: fullEmp?.name || stat.name,
      accountEmail: fullEmp?.accountEmail || fullEmp?.email || `${stat.name.toLowerCase()}@domain.com`,
      count: stat.count || 0,
      revenue: stat.revenue || 0,
      assignments: fullEmp?.assignments || [
        {
          id: 'default',
          assignedName: stat.name,
          startDate: fullEmp?.createdAt || new Date('2024-01-01'),
          isCurrent: true,
        },
      ],
      fullEmp,
    };
  });

  const handleCardClick = (card) => {
    setSelectedAccount(card.fullEmp || card);
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

  // Employee Performance Cards Grid View
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Employee Performance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            Monitor revenue and transaction metrics by account. Click any card to open detailed performance view.
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
