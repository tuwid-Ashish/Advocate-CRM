'use client';

const SERVICE_COLORS = {
  GST: 'bg-blue-100 text-blue-700 border-blue-200',
  TDS: 'bg-purple-100 text-purple-700 border-purple-200',
  PAN: 'bg-teal-100 text-teal-700 border-teal-200',
  ITR: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  DSC: 'bg-orange-100 text-orange-700 border-orange-200',
};

const DEFAULT_COLOR = 'bg-gray-100 text-gray-700 border-gray-200';

export const ServiceBadge = ({ type }) => {
  // Normalize type for matching
  const normalizedType = Object.keys(SERVICE_COLORS).find(key =>
    type?.toUpperCase().includes(key)
  );

  const colorClass = normalizedType ? SERVICE_COLORS[normalizedType] : DEFAULT_COLOR;

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${colorClass}`}>
      {type}
    </span>
  );
};
