import { Suspense } from 'react';
import { DashboardWithUrlSync } from './Dashboard';

const FallbackUI = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard…</p>
  </div>
);

export default function DashboardPage() {
  return (
    <Suspense fallback={<FallbackUI />}>
      <DashboardWithUrlSync />
    </Suspense>
  );
}
