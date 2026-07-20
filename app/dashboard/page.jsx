import { Suspense } from 'react';
import { Dashboard } from './Dashboard';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950"><p className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard…</p></div>}>
      <Dashboard />
    </Suspense>
  );
}
