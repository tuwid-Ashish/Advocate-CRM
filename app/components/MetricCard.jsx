export const MetricCard = ({ title, value, subtitle, icon: Icon }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 break-words">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="bg-blue-50 p-2 sm:p-3 rounded-lg shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};
