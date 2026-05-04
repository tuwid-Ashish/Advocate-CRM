const employees = ['Amit', 'Neha', 'Ravi', 'Pooja'];
const services = ['PAN Card', 'Aadhaar Update', 'RTI Filing', 'TDS Filing', 'ITR Filing'];
const paymentModes = ['Cash', 'UPI', 'Bank Transfer'];
const statuses = ['Completed', 'Pending', 'Processing'];

const generateTransactions = () => {
  const transactions = [];
  // Generate transactions for 2 months: March 2026 to May 2026
  const startDate = new Date(2026, 2, 1); // March 1, 2026
  const endDate = new Date(2026, 4, 4); // May 4, 2026 (today)

  const names = [
    'Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Sneha Desai', 'Vikram Reddy',
    'Anita Mishra', 'Sanjay Gupta', 'Divya Sharma', 'Rohan Nair', 'Pooja Verma',
    'Karan Arora', 'Neha Chopra', 'Arjun Menon', 'Shreya Rao', 'Aditya Singh',
    'Ravi Teja', 'Seema Kumar', 'Harish Patel', 'Anjali Nair', 'Vikram Joshi',
  ];

  // Generate 120 transactions spread across 2 months
  for (let i = 0; i < 120; i++) {
    const randomDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );

    transactions.push({
      id: `TXN-${2000 + i}`,
      customerName: names[Math.floor(Math.random() * names.length)],
      phone: `98${Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(8, '0')}`,
      service: services[Math.floor(Math.random() * services.length)],
      employee: employees[Math.floor(Math.random() * employees.length)],
      amountReceived: Math.floor(Math.random() * 4900) + 100,
      amountPaid: Math.floor(Math.random() * 3500),
      paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
      date: randomDate.toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: [
        'Verification completed',
        'Documents received',
        'Awaiting approval',
        'Pending customer callback',
        'On hold',
        'Resubmitted documents',
        '',
      ][Math.floor(Math.random() * 7)],
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const transactions = generateTransactions();
