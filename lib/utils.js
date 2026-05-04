export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Processing':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
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
