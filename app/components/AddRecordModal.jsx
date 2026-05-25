'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Info, Hash, Phone, Mail, User, Briefcase, Calendar, CreditCard, StickyNote, AlertCircle } from 'lucide-react';

const ONE_TIME_SERVICES = [
  { value: 'PAN', label: 'PAN' },
  { value: 'TAN', label: 'TAN' },
];

const BUSINESS_SERVICES = [
  { value: 'GST', label: 'GST' },
  { value: 'EXTRA_EXPENSE', label: 'Extra Expense' },
  { value: 'ITR', label: 'ITR' },
  { value: 'TDS', label: 'TDS' },
  { value: 'DSC', label: 'DSC' },
];

const GST_SUBCATEGORIES = [
  { value: 'GST_3B', label: 'GST 3B' },
  { value: 'GST_1', label: 'GST 1' },
];

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CREDIT', label: 'Credit' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Payment Pending' },
  { value: 'PARTIAL', label: 'Payment Partial' },
  { value: 'PAID',    label: 'Payment Paid'    },
  { value: 'RECEIVED',label: 'Payment Received'},
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const INITIAL_FORM = {
  recordKind: 'ONE_TIME',
  oneTimeService: 'PAN',
  businessService: 'GST',
  gstType: 'GST_3B',
  clientId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerReference: '',
  detailX: '',
  detailY: '',
  partyName: '',
  expenseTitle: '',
  expenseCategory: '',
  expenseMonth: String(new Date().getMonth() + 1),
  expenseYear: String(new Date().getFullYear()),
  gstMonth: String(new Date().getMonth() + 1),
  gstYear: String(new Date().getFullYear()),
  filingDate: '',
  paymentAmount: '',
  paymentMode: 'CASH',
  paymentStatus: 'PENDING',
  status: 'PENDING',
  notes: '',
};

export const AddRecordModal = ({ isOpen, onClose, clients, token, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const businessClients = useMemo(
    () => clients.filter((client) => client.type === 'BUSINESS_CLIENT'),
    [clients]
  );

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setIsLoading(false);
      setFormData(INITIAL_FORM);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill partyName with business name when clientId is selected for GST
    if (name === 'clientId' && formData.businessService === 'GST') {
      const selectedClient = businessClients.find(c => c.id === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        partyName: selectedClient?.businessName || ''
      }));
    } else if (name === 'businessService') {
      // Reset service-specific fields when switching record type
      const newFormData = { ...formData, [name]: value };
      if (value !== 'GST') {
        newFormData.partyName = '';
      }
      setFormData(newFormData);
    } else if (name === 'paymentAmount') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        paymentStatus:
          value && Number(value) > 0 && prev.paymentStatus === 'PENDING'
            ? 'PAID'
            : prev.paymentStatus,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const postJson = async (url, payload) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const getFriendlyErrorMessage = (errorMessage) => {
    if (!errorMessage) return 'Something went wrong. Please try again.';

    const lower = errorMessage.toLowerCase();

    if (lower.includes('reference') && lower.includes('must not be null')) {
      return 'Reference is required for one-time records.';
    }

    if (lower.includes('missing required fields')) {
      return 'Please fill all required fields before submitting.';
    }

    if (lower.includes('client not found')) {
      return 'Selected client could not be found. Please reselect and try again.';
    }

    return 'Unable to create the record. Please check the form and try again.';
  };

  const createOneTimeClient = async () => {
    const existingClient = clients.find(
      (client) => client.email?.toLowerCase() === formData.customerEmail.trim().toLowerCase()
    );
    if (existingClient) return existingClient.id;

    const data = await postJson('/api/clients', {
      type: 'ONE_TIME_CUSTOMER',
      fullName: formData.customerName.trim(),
      phone: formData.customerPhone.trim(),
      email: formData.customerEmail.trim(),
    });
    return data.client.id;
  };

  const buildRecordPayload = (clientId) => {
    const paymentAmount = formData.paymentAmount ? Number(formData.paymentAmount) : 0;
    const base = {
      clientId,
      paymentAmount,
      paymentMode: formData.paymentMode,
      paymentStatus: formData.paymentStatus,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    if (formData.recordKind === 'ONE_TIME') {
      return {
        ...base,
        serviceType: formData.oneTimeService,
        details: {
          kind: 'ONE_TIME',
          customerName: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
          email: formData.customerEmail.trim(),
          reference: formData.customerReference.trim(),
        },
      };
    }

    if (formData.businessService === 'GST') {
      const monthNumber = Number(formData.gstMonth);
      return {
        ...base,
        serviceType: formData.gstType,
        details: {
          kind: 'GST',
          partyName: formData.partyName.trim(),
          gstType: formData.gstType,
          monthNumber,
          year: Number(formData.gstYear),
          filingDate: formData.filingDate || null,
        },
      };
    }

    if (formData.businessService === 'EXTRA_EXPENSE') {
      const monthNumber = Number(formData.expenseMonth);
      return {
        ...base,
        serviceType: 'EXTRA_EXPENSE',
        details: {
          kind: 'EXTRA_EXPENSE',
          expenseTitle: formData.expenseTitle.trim(),
          expenseCategory: formData.expenseCategory.trim(),
          month: MONTHS[monthNumber - 1],
          monthNumber,
          year: Number(formData.expenseYear),
          amount: paymentAmount,
        },
      };
    }

    return {
      ...base,
      serviceType: formData.businessService,
      details: {
        kind: 'SIMPLE_BUSINESS',
        x: formData.detailX.trim(),
        y: formData.detailY.trim(),
      },
    };
  };

  const validate = () => {
    if (formData.recordKind === 'ONE_TIME') {
      if (!formData.customerName.trim()) return 'Customer name is required';
      if (!formData.customerEmail.trim()) return 'Customer email is required';
      if (!formData.customerReference.trim()) return 'Reference is required';
      return '';
    }
    if (!formData.clientId) return 'Please select a business client';
    if (formData.businessService === 'GST') {
      if (!formData.partyName.trim()) return 'Party name is required for GST';
      return '';
    }
    if (formData.businessService === 'EXTRA_EXPENSE') {
      if (!formData.expenseTitle.trim()) return 'Expense title is required';
      if (!formData.paymentAmount || Number(formData.paymentAmount) <= 0) return 'Expense amount is required';
      return '';
    }
    if (!formData.detailX.trim()) return 'First detail is required';
    if (!formData.detailY.trim()) return 'Second detail is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    try {
      const clientId = formData.recordKind === 'ONE_TIME' ? await createOneTimeClient() : formData.clientId;
      await postJson('/api/records', buildRecordPayload(clientId));
      await onSuccess();
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedServiceLabel = useMemo(() => {
    return formData.recordKind === 'ONE_TIME'
      ? ONE_TIME_SERVICES.find((item) => item.value === formData.oneTimeService)?.label
      : BUSINESS_SERVICES.find((item) => item.value === formData.businessService)?.label;
  }, [formData]);

  const previewText = useMemo(() => {
    if (formData.businessService === 'EXTRA_EXPENSE' && formData.recordKind === 'BUSINESS') {
      return `${formData.expenseTitle || 'Expense'}${formData.expenseCategory ? ` (${formData.expenseCategory})` : ''} Rs ${formData.paymentAmount || '0'} ${PAYMENT_MODES.find((mode) => mode.value === formData.paymentMode)?.label || 'Cash'}`;
    }

    if (formData.businessService !== 'GST' && formData.recordKind === 'BUSINESS') {
      return `${formData.detailX || 'x'} from ${formData.detailY || 'y'} Rs ${formData.paymentAmount || '0'} ${PAYMENT_MODES.find((mode) => mode.value === formData.paymentMode)?.label || 'Cash'
        }`;
    }
    return `${selectedServiceLabel} Rs ${formData.paymentAmount || '0'} ${PAYMENT_MODES.find((mode) => mode.value === formData.paymentMode)?.label || 'Cash'
      }`;
  }, [formData, selectedServiceLabel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Service Record</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select record type and fill operational details</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Record Categorization</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, recordKind: 'ONE_TIME' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${formData.recordKind === 'ONE_TIME'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
              >
                One-Time (PAN/TAN)
              </button>
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, recordKind: 'BUSINESS' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${formData.recordKind === 'BUSINESS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
              >
                Business Work
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Service Selection */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase className="w-3 h-3" /> Service Configuration
                </h3>

                <div className="space-y-4">
                  {formData.recordKind === 'ONE_TIME' ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">One-Time Service</label>
                      <select
                        name="oneTimeService"
                        value={formData.oneTimeService}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      >
                        {ONE_TIME_SERVICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Business Client</label>
                        <select
                          name="clientId"
                          value={formData.clientId}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        >
                          <option value="">Select Business</option>
                          {businessClients.map(c => <option key={c.id} value={c.id}>{c.businessName || c.email}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Business Service</label>
                        <select
                          name="businessService"
                          value={formData.businessService}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        >
                          {BUSINESS_SERVICES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>

                      {formData.businessService === 'GST' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">GST Type</label>
                          <select
                            name="gstType"
                            value={formData.gstType}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          >
                            {GST_SUBCATEGORIES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Financials
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <div className="relative group">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                      <input
                        type="number"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleChange}
                        placeholder="Amount Received"
                        className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <select
                    name="paymentMode"
                    value={formData.paymentMode}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    {PAYMENT_MODES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Specialized Details */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3" /> Information Breakdown
                </h3>

                <div className="bg-blue-50/30 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 min-h-[220px]">
                  {formData.recordKind === 'ONE_TIME' ? (
                    <div className="space-y-4">
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          placeholder="Full Name *"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          placeholder="Phone Number"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          placeholder="Email Address *"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          name="customerReference"
                          value={formData.customerReference}
                          onChange={handleChange}
                          placeholder="Reference *"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.businessService === 'GST' ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            name="partyName"
                            value={formData.partyName}
                            onChange={handleChange}
                            disabled={!!formData.clientId}
                            placeholder="Party Name *"
                            className={`w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${
                              formData.clientId ? 'opacity-75 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''
                            }`}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              name="gstMonth"
                              value={formData.gstMonth}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            >
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <input
                              type="number"
                              name="gstYear"
                              value={formData.gstYear}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                          </div>
                          <input
                            type="date"
                            name="filingDate"
                            value={formData.filingDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          />
                        </div>
                      ) : formData.businessService === 'EXTRA_EXPENSE' ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            name="expenseTitle"
                            value={formData.expenseTitle}
                            onChange={handleChange}
                            placeholder="Expense Title *"
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          />
                          <input
                            type="text"
                            name="expenseCategory"
                            value={formData.expenseCategory}
                            onChange={handleChange}
                            placeholder="Category (e.g. Office, Travel)"
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <select
                              name="expenseMonth"
                              value={formData.expenseMonth}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            >
                              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                            </select>
                            <input
                              type="number"
                              name="expenseYear"
                              value={formData.expenseYear}
                              onChange={handleChange}
                              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <input
                            type="text"
                            name="detailX"
                            value={formData.detailX}
                            onChange={handleChange}
                            placeholder="Primary Detail (e.g. FY)"
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          />
                          <input
                            type="text"
                            name="detailY"
                            value={formData.detailY}
                            onChange={handleChange}
                            placeholder="Secondary Detail"
                            className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Live Preview
                </p>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{previewText}"
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
              <StickyNote className="w-3 h-3 inline mr-1.5" /> Internal Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Optional internal remarks..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none outline-none"
            />
          </div>
        </form>

        <div className="p-6 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 dark:shadow-none uppercase tracking-widest disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Create Record
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
