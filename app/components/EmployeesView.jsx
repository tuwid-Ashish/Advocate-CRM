'use client';

import { formatCurrency } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

export const EmployeesView = ({ employeeStats }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employee Performance</h1>
        <p className="text-gray-600 mt-1">Monitor revenue and transaction metrics by employee</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employeeStats.map((emp) => (
          <div
            key={emp.name}
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{emp.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{emp.count}</p>
                <p className="text-xs text-gray-500 mt-1">Transactions</p>
                <p className="text-xl font-bold text-green-600 mt-3">{formatCurrency(emp.revenue)}</p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
