'use client';

import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export const TransactionTable = ({ transactions, onRowClick }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Service</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Employee</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn, idx) => (
              <tr
                key={txn.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onRowClick(txn)}
              >
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatDate(txn.date)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{txn.customerName}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{txn.service}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{txn.employee}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">
                  {formatCurrency(txn.amountReceived)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {txn.paymentMode}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(txn.status)}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
