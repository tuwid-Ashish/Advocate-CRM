'use client';

import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { ServiceBadge } from './ServiceBadge';
import { Eye, Pencil, Receipt } from 'lucide-react';

export const TransactionTable = ({ transactions, onRowClick, onEdit }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="md:hidden divide-y divide-gray-100">
        {transactions.map((txn) => (
          <button
            key={txn.id}
            type="button"
            className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
            onClick={() => onRowClick(txn)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{txn.customerName}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(txn.date)}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(txn.status)}`}>
                {txn.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <p>
                <span className="font-medium text-gray-700">Service:</span> {txn.service}
              </p>
              <p>
                <span className="font-medium text-gray-700">Employee:</span> {txn.employee}
              </p>
              <p>
                <span className="font-medium text-gray-700">Mode:</span> {txn.paymentMode}
              </p>
              {txn.serviceDetail && (
                <p className="col-span-2">
                  <span className="font-medium text-gray-700">Details:</span> {txn.serviceDetail}
                </p>
              )}
              <p className="font-semibold text-gray-900">{formatCurrency(txn.amountReceived)}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Employee</th>
              <th className="px-6 py-2 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mode</th>
              <th className="px-6 py-2 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-2 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr
                key={txn.id}
                className="border-b border-gray-50 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onRowClick(txn)}
              >
                <td className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(txn.date)}</td>
                <td className="px-6 py-2 text-sm font-semibold text-gray-900 dark:text-white">{txn.customerName}</td>
                <td className="px-6 py-2 text-sm">
                  <ServiceBadge type={txn.service} />
                </td>
                <td className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                  {txn.serviceDetail || '-'}
                </td>
                <td className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400">{txn.employee}</td>
                <td className="px-6 py-2 text-base font-bold text-gray-900 dark:text-white text-right tracking-tight tabular-nums">
                  {formatCurrency(txn.amountReceived)}
                </td>
                <td className="px-6 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {txn.paymentMode}
                </td>
                <td className="px-6 py-2 text-sm">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(txn.status)}`}>
                    {txn.status}
                  </span>
                </td>
                <td className="px-6 py-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRowClick(txn); }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(txn); }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-amber-600 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
