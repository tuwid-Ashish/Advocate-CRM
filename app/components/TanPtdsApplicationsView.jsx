"use client";
import { useState, useEffect, useMemo } from 'react';
import { MetricCard } from '@/app/components/MetricCard';
import { Download, RefreshCw } from 'lucide-react';

export default function TanPtdsApplicationsView({ dateFilter = { startDate: '', endDate: '' } }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
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
    </div>
  );
}
