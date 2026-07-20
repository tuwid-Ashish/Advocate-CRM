"use client";
import { useState, useEffect, useMemo } from 'react';
import { MetricCard } from '@/app/components/MetricCard';
import { Download, RefreshCw, X } from 'lucide-react';

export default function PanApplicationsView({ dateFilter = { startDate: '', endDate: '' } }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    if (!startDate && !endDate) return records;

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return records.filter((r) => {
      const current = new Date(r.date);
      if (start && current < start) return false;
      if (end && current > end) return false;
      return true;
    });
  }, [records, dateFilter]);

  const metricTitle = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    if (!startDate && !endDate) return 'Total PAN Applications';
    if (startDate && endDate && startDate === endDate) return `PAN Applications on ${startDate}`;
    if (startDate && endDate) return `PAN Applications (${startDate} to ${endDate})`;
    if (startDate) return `PAN Applications from ${startDate}`;
    return `PAN Applications up to ${endDate}`;
  }, [dateFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/applications/pan');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Failed to fetch PAN applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = () => {
    const headers = ["Ack No", "Coupon No", "Name", "Application Type", "Date", "Status", "PAN", "Mode of Submission"];

    if (!filteredRecords.length) return;

    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => [r.ackNo, r.couponNo, `"${r.name}"`, r.applicationType, new Date(r.date).toLocaleDateString(), r.status, r.pan, r.modeOfSubmission].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'pan_applications.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-6 mb-2">
        <MetricCard title={metricTitle} value={filteredRecords.length} />
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Showing {filteredRecords.length} records
        </p>

        <div className="flex justify-end gap-3">
        <button onClick={fetchData} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <RefreshCw size={18} /> Refresh
        </button>
        <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
          <Download size={18} /> Download
        </button>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">All PAN Applications</h2>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
              <thead className="text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Ack No</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Date</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">PAN</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length ? (
                  filteredRecords.map(record => (
                    <tr 
                      key={record.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.ackNo}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.name}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.status}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.pan || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No PAN application records found for selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">PAN Application Details</h3>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center justify-between border border-blue-100 dark:border-blue-800/50">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecord.status}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Appln Fee</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{selectedRecord.fee?.toLocaleString() || '0'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date(selectedRecord.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Applicant Name</label>
                  <div className="text-base text-gray-900 dark:text-white font-medium">{selectedRecord.name}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Application Type</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.applicationType}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Acknowledgment Number</label>
                  <div className="text-base text-gray-900 dark:text-white tabular-nums">{selectedRecord.ackNo}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Coupon Number</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.couponNo || <span className="text-gray-400 italic">Not available</span>}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">PAN Number</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.pan || <span className="text-gray-400 italic">Pending/Not available</span>}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Mode of Submission</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.modeOfSubmission || <span className="text-gray-400 italic">Not available</span>}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Payment Status</label>
                  <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedRecord.fee > 0 ? 'PAID' : 'PENDING'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 mt-auto">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
