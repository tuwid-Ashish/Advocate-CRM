'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const PaymentModeChart = ({ data }) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-colors">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest font-bold">Payment Mode Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EmployeeRevenueChart = ({ data }) => {
  const chartData = data.slice(0, 5).map((emp) => ({
    name: emp.name,
    revenue: emp.revenue,
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-colors">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest font-bold">Top Employee Revenue</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip 
            formatter={(value) => `₹${value.toLocaleString()}`}
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StatusBreakdownChart = ({ data }) => {
  const STATUS_COLORS = {
    'Completed': '#10b981',
    'Pending': '#f59e0b',
    'Processing': '#3b82f6',
    'Archived': '#6b7280',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-colors">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest font-bold">Transaction Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.2} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ServiceCountChart = ({ data }) => {
  const chartData = data.slice(0, 5).map((svc) => ({
    name: svc.name,
    count: svc.count,
  }));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm transition-colors">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-widest font-bold">Top Services</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} angle={-32} textAnchor="end" height={65} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
