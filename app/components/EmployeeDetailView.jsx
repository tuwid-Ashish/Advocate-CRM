'use client';

import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  UserCheck,
  Mail,
  Calendar,
  Clock,
  FileText,
  History,
  UserPlus,
  Search,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { formatCurrency, formatDateShort, getStatusColor } from '@/lib/utils';
import { ServiceBadge } from './ServiceBadge';

export const EmployeeDetailView = ({
  employeeAccount,
  allTransactions = [],
  onBack,
  onOpenReassign,
}) => {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [recordSearch, setRecordSearch] = useState('');

  if (!employeeAccount) return null;

  const email = employeeAccount.accountEmail || employeeAccount.email || 'N/A';
  const assignments = employeeAccount.assignments || [];

  // Find current active assignment
  const currentAssignment = assignments.find((a) => a.isCurrent) || assignments[0];

  // Selected assignment (defaults to current active assignment)
  const activeSelectedAssignment = useMemo(() => {
    if (!selectedAssignmentId) return currentAssignment;
    return assignments.find((a) => a.id === selectedAssignmentId) || currentAssignment;
  }, [selectedAssignmentId, assignments, currentAssignment]);

  const isCurrentSelected = activeSelectedAssignment?.id === currentAssignment?.id;

  // Filter records belonging strictly to the selected assignment
  const assignmentRecords = useMemo(() => {
    if (!activeSelectedAssignment) return [];

    const assignmentId = activeSelectedAssignment.id;
    const start = new Date(activeSelectedAssignment.startDate);
    const end = activeSelectedAssignment.endDate
      ? new Date(activeSelectedAssignment.endDate)
      : new Date();

    return allTransactions.filter((txn) => {
      const record = txn.record;
      if (!record) return false;

      // Must belong to this employee account
      if (record.createdById !== employeeAccount.id) return false;

      // Match by assignmentId if attached
      if (record.assignmentId) {
        return record.assignmentId === assignmentId;
      }

      // Fallback matching by creation date within assignment window
      const recDate = new Date(txn.date);
      return recDate >= start && recDate <= end;
    });
  }, [allTransactions, employeeAccount.id, activeSelectedAssignment]);

  // Filtered records by search query
  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return assignmentRecords;
    const q = recordSearch.toLowerCase();
    return assignmentRecords.filter(
      (txn) =>
        txn.customerName.toLowerCase().includes(q) ||
        txn.service.toLowerCase().includes(q) ||
        txn.status.toLowerCase().includes(q) ||
        txn.paymentStatus.toLowerCase().includes(q)
    );
  }, [assignmentRecords, recordSearch]);

  // Metrics for selected assignment
  const assignmentMetrics = useMemo(() => {
    const totalCount = assignmentRecords.length;
    const totalRevenue = assignmentRecords.reduce((sum, t) => sum + t.amountReceived, 0);
    const completedCount = assignmentRecords.filter(
      (t) => t.status === 'Completed' || t.status === 'COMPLETED'
    ).length;
    return { totalCount, totalRevenue, completedCount };
  }, [assignmentRecords]);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Employee List</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                Employee Account Details
              </span>
              <span className="text-xs text-gray-400 font-mono">ID: {employeeAccount.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              <span>{email}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenReassign(employeeAccount)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Reassign Employee Account</span>
          </button>
        </div>
      </div>

      {/* Selected Assignment Status Banner */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
          isCurrentSelected
            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 shadow-sm'
            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`p-3.5 rounded-2xl ${
              isCurrentSelected ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            <UserCheck className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                  isCurrentSelected
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300'
                }`}
              >
                {isCurrentSelected ? 'Current Active Assignment' : 'Historical Assignment (Read-Only)'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {activeSelectedAssignment?.assignedName || 'Employee'}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mt-1 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>
                Assignment Period:{' '}
                <strong>{formatDateShort(activeSelectedAssignment?.startDate)}</strong> →{' '}
                <strong>
                  {activeSelectedAssignment?.isCurrent
                    ? 'Present (Active)'
                    : formatDateShort(activeSelectedAssignment?.endDate)}
                </strong>
              </span>
            </p>
          </div>
        </div>

        {!isCurrentSelected && (
          <button
            onClick={() => setSelectedAssignmentId(null)}
            className="px-4 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/80 rounded-xl transition-all flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Active Assignment ({currentAssignment?.assignedName})</span>
          </button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Assignment Revenue
            </p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1 tabular-nums">
              {formatCurrency(assignmentMetrics.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Generated by {activeSelectedAssignment?.assignedName}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-xl text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Total Transactions
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">
              {assignmentMetrics.totalCount}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">During this assignment</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Completed Tasks
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1 tabular-nums">
              {assignmentMetrics.completedCount}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Successfully completed</p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Full-Width Records Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>
                Service Records for {activeSelectedAssignment?.assignedName} ({filteredRecords.length})
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Strictly showing records created during {activeSelectedAssignment?.assignedName}&apos;s assignment period.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignment records..."
              value={recordSearch}
              onChange={(e) => setRecordSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm bg-gray-50/50 dark:bg-gray-950/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            No service records found for {activeSelectedAssignment?.assignedName} during this assignment period.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase font-bold text-[11px] tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Service Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Work Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                {filteredRecords.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs text-gray-500 dark:text-gray-400">
                      {formatDateShort(txn.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      {txn.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <ServiceBadge type={txn.service} />
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(txn.amountReceived)}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500 font-medium">
                      {txn.paymentMode}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                        {txn.paymentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(txn.status)}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment History & Timeline Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <span>Assignment Timeline & History</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete historical record of all employees assigned to account {email}.
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
            {assignments.length} {assignments.length === 1 ? 'Assignment Period' : 'Assignment Periods'}
          </span>
        </div>

        <div className="space-y-4 relative pl-8 before:content-[''] before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-800">
          {assignments.map((asgn, index) => {
            const isSelected = activeSelectedAssignment?.id === asgn.id;

            return (
              <div
                key={asgn.id || index}
                className={`relative p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-gray-50/50 dark:bg-gray-950/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }`}
              >
                {/* Timeline Bullet */}
                <div
                  className={`absolute -left-[28px] top-5 w-4 h-4 rounded-full border-2 bg-white dark:bg-gray-900 ${
                    asgn.isCurrent
                      ? 'border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950'
                      : 'border-gray-400'
                  }`}
                />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {asgn.assignedName}
                      </span>

                      {asgn.isCurrent ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                          Current Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          Past Assignment
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {formatDateShort(asgn.startDate)} →{' '}
                        {asgn.isCurrent ? 'Present (Active)' : formatDateShort(asgn.endDate)}
                      </span>
                    </p>

                    {asgn.notes && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic bg-white/80 dark:bg-gray-800/80 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        &quot;{asgn.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isSelected ? (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 bg-blue-100/70 dark:bg-blue-900/50 px-4 py-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" /> Currently Viewing Records
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedAssignmentId(asgn.id)}
                        className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm"
                      >
                        View {asgn.assignedName}&apos;s Historical Records
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
