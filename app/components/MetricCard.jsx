export const MetricCard = ({ title, value, subtitle, icon: Icon, variant = 'default' }) => {
  const variants = {
    default: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
    danger: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
  };

  const iconClasses = variants[variant] || variants.default;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums tracking-tight">
            {value}
          </p>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg border transition-transform group-hover:scale-110 ${iconClasses}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-0.5 opacity-20 ${variant === 'default' ? 'bg-blue-600' : variant === 'success' ? 'bg-emerald-600' : variant === 'warning' ? 'bg-amber-600' : 'bg-rose-600'}`} />
    </div>
  );
};
