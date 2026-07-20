"use client";
import { useState, useEffect, useMemo } from 'react';
import { MetricCard } from '@/app/components/MetricCard';
import { Download, RefreshCw, X } from 'lucide-react';

export default function TanPtdsApplicationsView({ dateFilter = { startDate: '', endDate: '' } }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filteredRecords = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    if (!startDate && !endDate) return records;

    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return records.filter((r) => {
      const current = new Date(r.receiptDate);
      if (start && current < start) return false;
      if (end && current > end) return false;
      return true;
    });
  }, [records, dateFilter]);

  const metricSuffix = useMemo(() => {
    const { startDate, endDate } = dateFilter;
    if (!startDate && !endDate) return 'Total';
    if (startDate && endDate && startDate === endDate) return `on ${startDate}`;
    if (startDate && endDate) return `(${startDate} to ${endDate})`;
    if (startDate) return `from ${startDate}`;
    return `up to ${endDate}`;
  }, [dateFilter]);

  const tanCount = useMemo(
    () => filteredRecords.filter((record) => String(record.sourceType).toUpperCase() === 'TAN').length,
    [filteredRecords]
  );

  const ptdsCount = useMemo(
    () => filteredRecords.filter((record) => String(record.sourceType).toUpperCase() === 'PTDS').length,
    [filteredRecords]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/applications/tan-ptds');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Failed to fetch TAN/PTDS applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = () => {
    const headers = ["Source Type", "Acknowledgment No", "Receipt Date", "Applicant Name", "Application Type", "User ID", "Fees Charged"];

    if (!filteredRecords.length) return;

    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(r => [r.sourceType, r.acknowledgmentNo, new Date(r.receiptDate).toLocaleDateString(), `"${r.applicantName}"`, r.applicationType, r.userId, r.feesCharged].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tan_ptds_applications.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        <MetricCard title={`TAN Applications ${metricSuffix}`} value={tanCount} />
        <MetricCard title={`PTDS Applications ${metricSuffix}`} value={ptdsCount} />
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
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">All TAN/PTDS Applications</h2>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
              <thead className="text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Source</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Ack No</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Applicant Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">Receipt Date</th>
                  <th className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 text-left">User ID</th>
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
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.sourceType}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.acknowledgmentNo}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.applicantName}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{new Date(record.receiptDate).toLocaleDateString()}</td>
                      <td className="py-2 px-4 border-b border-gray-100 dark:border-gray-800">{record.userId}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No TAN/PTDS application records found for selected date range.
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
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedRecord.sourceType} Application Details
                </h3>
                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  selectedRecord.sourceType === 'TAN' 
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {selectedRecord.sourceType}
                </span>
              </div>
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
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Receipt Date</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{new Date(selectedRecord.receiptDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Fees Charged</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₹{selectedRecord.feesCharged?.toLocaleString() || '0'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Applicant Name</label>
                  <div className="text-base text-gray-900 dark:text-white font-medium">{selectedRecord.applicantName}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Application Type</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.applicationType}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Acknowledgment Number</label>
                  <div className="text-base text-gray-900 dark:text-white tabular-nums">{selectedRecord.acknowledgmentNo}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">TAN Number</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.tan || <span className="text-gray-400 italic">Not available</span>}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.category || <span className="text-gray-400 italic">Not available</span>}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">User ID</label>
                  <div className="text-base text-gray-900 dark:text-white">{selectedRecord.userId}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Payment Status</label>
                  <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedRecord.feesCharged > 0 ? 'PAID' : 'PENDING'}
                  </div>
                </div>

                {selectedRecord.changesRequested && (
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">Changes Requested</label>
                    <div className="text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700">{selectedRecord.changesRequested}</div>
                  </div>
                )}
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
