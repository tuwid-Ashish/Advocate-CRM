export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50';
    case 'Pending':
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/50';
    case 'Processing':
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
    case 'Archived':
    case 'ARCHIVED':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

export const calculateMetrics = (transactions) => {
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amountReceived, 0);
  const totalCount = transactions.length;
  
  const paymentModeBreakdown = {
    cash: transactions.filter((t) => t.paymentMode === 'Cash').length,
    upi: transactions.filter((t) => t.paymentMode === 'UPI').length,
    bank: transactions.filter((t) => t.paymentMode === 'Bank Transfer').length,
  };

  const statusBreakdown = {
    completed: transactions.filter((t) => t.status === 'Completed').length,
    pending: transactions.filter((t) => t.status === 'Pending').length,
    processing: transactions.filter((t) => t.status === 'Processing').length,
  };

  return {
    totalRevenue,
    totalCount,
    paymentModeBreakdown,
    statusBreakdown,
  };
};

export const getEmployeeStats = (transactions) => {
  const stats = {};

  transactions.forEach((t) => {
    if (!stats[t.employee]) {
      stats[t.employee] = {
        name: t.employee,
        revenue: 0,
        count: 0,
      };
    }
    stats[t.employee].revenue += t.amountReceived;
    stats[t.employee].count += 1;
  });

  return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
};

export const getServiceStats = (transactions) => {
  const stats = {};

  transactions.forEach((t) => {
    if (!stats[t.service]) {
      stats[t.service] = {
        name: t.service,
        count: 0,
        revenue: 0,
      };
    }
    stats[t.service].count += 1;
    stats[t.service].revenue += t.amountReceived;
  });

  return Object.values(stats).sort((a, b) => b.count - a.count);
};
