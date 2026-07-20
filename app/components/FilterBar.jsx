'use client';

import { Search, X } from 'lucide-react';

const QUICK_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'this_week', label: 'This Week' },
  { id: 'gst', label: 'GST' },
  { id: 'pan', label: 'PAN' },
  // Metric-triggered filters (shown only when active)
  { id: 'pending_payment', label: 'Pending Payments', metricOnly: true },
  { id: 'overdue', label: 'Overdue Tasks', metricOnly: true },
];

export const FilterBar = ({ 
  filters, 
  onFilterChange, 
  onQuickFilter, 
  activeQuickFilter,
  onSearch,
  searchQuery,
  searchInputRef,
  employees = [],
  userRole = '',
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 lg:px-8 py-3 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search… (press / to focus)"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>

        {/* Quick filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_FILTERS.filter(f => !f.metricOnly || activeQuickFilter === f.id).map((filter) => (
            <button
              key={filter.id}
              onClick={() => onQuickFilter(activeQuickFilter === filter.id ? null : filter.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                activeQuickFilter === filter.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              {filter.label}
            </button>
          ))}
          {activeQuickFilter && (
            <button
              onClick={() => onQuickFilter(null)}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ml-1 underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <select
            value={filters.serviceType || ''}
            onChange={(e) => onFilterChange({ ...filters, serviceType: e.target.value })}
            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
          >
            <option value="">All Services</option>
            <option value="PAN">PAN</option>
            <option value="TAN">TAN</option>
            <option value="GST_3B">GST 3B</option>
            <option value="GST_1">GST 1</option>
            <option value="ITR">ITR</option>
            <option value="TDS">TDS</option>
            <option value="DSC">DSC</option>
            <option value="EXTRA_EXPENSE">Extra Expense</option>
          </select>

          {userRole === 'admin' && (
            <select
              value={filters.employeeId || ''}
              onChange={(e) => onFilterChange({ ...filters, employeeId: e.target.value })}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
            <span className="text-gray-400 dark:text-gray-500 text-xs">to</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>
        </div>

        {/* Hotkey hints */}
        <div className="hidden lg:flex items-center gap-3 ml-auto shrink-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono dark:text-gray-400">/</kbd>
            search
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono dark:text-gray-400">N</kbd>
            new
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono dark:text-gray-400">Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
};
