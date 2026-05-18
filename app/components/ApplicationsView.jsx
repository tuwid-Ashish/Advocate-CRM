"use client";
import { useState } from 'react';
import PanApplicationsView from '@/app/components/PanApplicationsView';
import TanPtdsApplicationsView from '@/app/components/TanPtdsApplicationsView';

export default function ApplicationsView() {
  const [activeTab, setActiveTab] = useState('pan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const applyPreset = (preset) => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
      return;
    }

    if (preset === 'last7') {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      setStartDate(from.toISOString().slice(0, 10));
      setEndDate(today);
      return;
    }

    if (preset === 'last30') {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      setStartDate(from.toISOString().slice(0, 10));
      setEndDate(today);
      return;
    }

    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-2">
        <button
          className={`py-2 px-4 text-lg ${activeTab === 'pan' ? 'border-b-2 border-blue-500 font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('pan')}
        >
          PAN Applications
        </button>
        <button
          className={`py-2 px-4 text-lg ${activeTab === 'tan-ptds' ? 'border-b-2 border-blue-500 font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setActiveTab('tan-ptds')}
        >
          TAN/PTDS Applications
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={() => applyPreset('today')}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyPreset('last7')}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset('last30')}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset('all')}
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            All
          </button>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <label className="text-sm text-gray-600 dark:text-gray-300">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
            />
            <label className="text-sm text-gray-600 dark:text-gray-300">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        {activeTab === 'pan' && <PanApplicationsView dateFilter={{ startDate, endDate }} />}
        {activeTab === 'tan-ptds' && <TanPtdsApplicationsView dateFilter={{ startDate, endDate }} />}
      </div>
    </div>
  );
}
