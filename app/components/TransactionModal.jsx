'use client';

import { formatCurrency, formatDate, formatDateShort, getStatusColor } from '@/lib/utils';
import { X, User, Briefcase, CreditCard, Clock, FileText } from 'lucide-react';
import { ServiceBadge } from './ServiceBadge';

export const TransactionModal = ({ transaction, onClose, onEdit }) => {
  if (!transaction) return null;

  const record = transaction.record || {};
  const details = record.details || {};
  const itr = record.itrRecord || {};
  const isItr = record.serviceType === 'ITR' || transaction.service === 'ITR';
  const itrFields = isItr
    ? [
        { label: 'ITR Form', value: itr.itrForm || details.itr_form },
        { label: 'Assessment Year', value: itr.financialYear || details.assessment_year },
        { label: 'Filing Status', value: itr.filingStatus || details.filing_status },
        {
          label: 'Filing Date',
          value: formatDateShort(itr.filingDate || details.filing_date),
        },
        { label: 'Total Income', value: itr.grossTotalIncome || details.total_income },
        { label: 'Tax Paid', value: itr.totalTaxPayable || details.tax_paid },
        { label: 'Refund Status', value: details.refund_status },
      ].filter((item) => item.value)
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Record Overview</h2>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-tighter">ID: {transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Status & Date Row */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2 flex-wrap">
               <div className='flex items-center gap-1.5'>
                <p className='text-[12px] font-bold text-gray-400'>Payment Status: </p>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800">
                  {transaction.paymentStatus || 'Pending'}
                </span>
               </div>
              <div className='flex items-center gap-1.5'>
                <p className='text-[12px] font-bold text-gray-400'>Work Status: </p>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
             </div>
             </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{formatDate(transaction.date)}</span>
              </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3 h-3" /> Customer
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{transaction.customerName}</p>
              <p className="text-sm text-gray-500 font-semibold tabular-nums">{transaction.phone ||`PAN : ${transaction.record.client.panId}`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" /> Service
              </p>
              <div>
                <ServiceBadge type={transaction.service} />
              </div>
              <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tight">By: {transaction.employee}</p>
            </div>
          </div>

          {/* Details Block */}
          {transaction.serviceDetail && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Service Details
              </p>
              <div className="bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-lg p-3 text-xs text-slate-700 dark:text-gray-300 leading-relaxed font-medium">
                {transaction.serviceDetail}
              </div>
            </div>
          )}

          {itrFields.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> ITR Details
              </p>
              <div className="bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-lg p-3 text-xs text-slate-700 dark:text-gray-300">
                <div className="grid grid-cols-2 gap-2">
                  {itrFields.map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 break-words">
                        {String(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Financials Box */}
         { itrFields.length == 0 &&  <div className="bg-blue-600 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
            <div className="flex items-center justify-between opacity-80 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest">Total Amount</p>
              <CreditCard className="w-4 h-4" />
            </div>
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {formatCurrency(transaction.amountReceived)}
            </p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-[10px] font-bold opacity-70 uppercase">Payment Mode</p>
                <p className="text-xs font-bold mt-1">{transaction.paymentMode}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold opacity-70 uppercase">Payment Status</p>
                <p className="text-xs font-bold mt-1">{transaction.paymentStatus || 'Pending'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold opacity-70 uppercase">Work Status</p>
                <p className="text-xs font-bold mt-1">{transaction.status}</p>
              </div>
            </div>
          </div>}

          {/* Notes */}
          {transaction.notes && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Notes</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 italic">
                "{transaction.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-wider"
          >
            Dismiss
          </button>
          <button 
            onClick={() => { onClose(); onEdit(transaction); }}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none uppercase tracking-wider"
          >
            Edit Record
          </button>
        </div>
      </div>
    </div>
  );
};
