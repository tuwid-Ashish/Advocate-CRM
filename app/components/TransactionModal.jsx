'use client';

import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { X } from 'lucide-react';

export const TransactionModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Transaction ID</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{transaction.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Date</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{formatDate(transaction.date)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-medium mb-2">Customer Information</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-900">
                <span className="font-medium">Name:</span> {transaction.customerName}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Phone:</span> {transaction.phone}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium">Service</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{transaction.service}</p>
          </div>

          {transaction.serviceDetail && (
            <div>
              <p className="text-xs text-gray-600 font-medium">Service Details</p>
              <p className="text-sm text-gray-900 mt-1 bg-gray-50 rounded p-2">
                {transaction.serviceDetail}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-600 font-medium">Handled by</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{transaction.employee}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-blue-700 font-medium">Amount Received</p>
              <p className="text-sm font-bold text-blue-900 mt-1">
                {formatCurrency(transaction.amountReceived)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Amount Paid</p>
              <p className="text-sm font-bold text-blue-900 mt-1">
                {formatCurrency(transaction.amountPaid)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Payment Mode</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{transaction.paymentMode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium border mt-1 ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {transaction.notes && (
            <div>
              <p className="text-xs text-gray-600 font-medium">Notes</p>
              <p className="text-sm text-gray-900 mt-1 bg-gray-50 rounded p-2">{transaction.notes}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
};
