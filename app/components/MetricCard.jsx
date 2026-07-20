export const MetricCard = ({ title, value, subtitle, icon: Icon, variant = 'default', onClick }) => {
  const variants = {
    default: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
    success: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    warning: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
    danger: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
  };

  const ringVariants = {
    default: 'hover:ring-2 hover:ring-blue-400/40 hover:border-blue-300 dark:hover:border-blue-700',
    success: 'hover:ring-2 hover:ring-emerald-400/40 hover:border-emerald-300 dark:hover:border-emerald-700',
    warning: 'hover:ring-2 hover:ring-amber-400/40 hover:border-amber-300 dark:hover:border-amber-700',
    danger: 'hover:ring-2 hover:ring-rose-400/40 hover:border-rose-300 dark:hover:border-rose-700',
  };

  const accentColor = {
    default: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
  };

  const viewTextColor = {
    default: 'text-blue-500 dark:text-blue-400',
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    danger: 'text-rose-500 dark:text-rose-400',
  };

  const iconClasses = variants[variant] || variants.default;
  const ringClasses = onClick ? (ringVariants[variant] || ringVariants.default) : '';
  const cursorClass = onClick ? 'cursor-pointer active:scale-[0.98]' : '';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
      className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group select-none ${cursorClass} ${ringClasses}`}
    >
      <div className="flex items-start justify-between">
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums tracking-tight">
            {value}
          </p>
          {subtitle && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">{subtitle}</p>}
          {onClick && (
            <p className={`text-[10px] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ${viewTextColor[variant] || viewTextColor.default}`}>
              View records
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg border transition-transform group-hover:scale-110 ${iconClasses}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-0.5 opacity-20 ${accentColor[variant] || accentColor.default}`} />
      {onClick && (
        <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 ${accentColor[variant] || accentColor.default} opacity-70`} />
      )}
    </div>
  );
};
