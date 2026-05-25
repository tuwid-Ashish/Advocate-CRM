'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Save,
  Trash2,
  AlertCircle,
  Info,
  Hash,
  Phone,
  Mail,
  User,
  Briefcase,
  Calendar,
  CreditCard,
  StickyNote,
} from 'lucide-react';

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CREDIT', label: 'Credit' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Payment Pending' },
  { value: 'PARTIAL', label: 'Payment Partial' },
  { value: 'PAID', label: 'Payment Paid' },
  { value: 'RECEIVED', label: 'Payment Received' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const EditRecordModal = ({
  isOpen,
  onClose,
  record,
  clients = [],
  onSuccess,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleUnauthorized = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      router.push('/login');
    }
  };

  const detailsKind = useMemo(() => {
    if (!record) return null;
    return record.record.details?.kind || (['PAN', 'TAN'].includes(record.record.serviceType) ? 'ONE_TIME' : record.record.serviceType === 'EXTRA_EXPENSE' ? 'EXTRA_EXPENSE' : 'BUSINESS');
  }, [record]);

  useEffect(() => {
    if (record && isOpen) {
      const details = record.record.details || {};
      const payment = record.record.payment || {};
      const paymentStatus = record.record.paymentStatus || payment.status || 'PENDING';

      setFormData({
        id: record.id,
        customerName: details.customerName || '',
        customerPhone: details.phone || '',
        customerEmail: details.email || '',
        customerReference: details.reference || '',
        partyName: details.partyName || '',
        gstMonth: String(details.monthNumber || new Date().getMonth() + 1),
        gstYear: String(details.year || new Date().getFullYear()),
        detailX: details.x || '',
        detailY: details.y || '',
        expenseTitle: details.expenseTitle || '',
        expenseCategory: details.expenseCategory || '',
        expenseMonth: String(details.monthNumber || new Date().getMonth() + 1),
        expenseYear: String(details.year || new Date().getFullYear()),
        paymentAmount: String(payment.amount || 0),
        paymentMode: payment.mode || 'CASH',
        paymentStatus: paymentStatus === 'COMPLETED' ? 'PAID' : paymentStatus,
        status: record.record.status,
        notes: record.record.notes || '',
      });
    }
  }, [record, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'paymentAmount' && value && Number(value) > 0 && prev.paymentStatus === 'PENDING'
        ? { paymentStatus: 'PAID' }
        : {}),
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const paymentAmount = Number(formData.paymentAmount);
      
      // Use the component-level detailsKind
      
      let details = {};
      if (detailsKind === 'ONE_TIME') {
        details = {
          ...record?.record?.details,
          kind: 'ONE_TIME',
          customerName: formData.customerName,
          phone: formData.customerPhone,
          email: formData.customerEmail,
          reference: formData.customerReference,
        };
      } else if (detailsKind === 'GST' || ['GST_3B', 'GST_1'].includes(record?.record?.serviceType)) {
        details = {
          ...record?.record?.details,
          kind: 'GST',
          partyName: formData.partyName,
          monthNumber: Number(formData.gstMonth),
          year: Number(formData.gstYear),
        };
      } else if (detailsKind === 'EXTRA_EXPENSE' || record?.record?.serviceType === 'EXTRA_EXPENSE') {
        details = {
          ...record?.record?.details,
          kind: 'EXTRA_EXPENSE',
          expenseTitle: formData.expenseTitle,
          expenseCategory: formData.expenseCategory,
          month: MONTHS[Number(formData.expenseMonth) - 1],
          monthNumber: Number(formData.expenseMonth),
          year: Number(formData.expenseYear),
          amount: paymentAmount,
        };
      } else {
        // Fallback for SIMPLE_BUSINESS or other types
        details = {
          ...record?.record?.details,
          kind: 'SIMPLE_BUSINESS',
          x: formData.detailX,
          y: formData.detailY,
        };
      }

      const payload = {
        details,
        notes: formData.notes,
        paymentAmount,
        paymentMode: formData.paymentMode,
        paymentStatus: formData.paymentStatus,
        status: formData.status,
      };

      const response = await fetch(`/api/records/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || data?.message || 'Failed to update record');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this record?'
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/records/${formData.id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  const previewText = useMemo(() => {
    if (!formData) return '';

    return `${formData.partyName || formData.customerName || 'Client'}
• ₹${formData.paymentAmount}
• ${formData.paymentMode}`;
  }, [formData]);

  if (!isOpen || !formData) return null;

  const statusStyles = {
    PENDING:
      'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300',
    IN_PROGRESS:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
    COMPLETED:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300',
    ARCHIVED:
      'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[95vh] flex flex-col">

        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Record
              </h2>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[formData.status]}`}
              >
                {formData.status.replace('_', ' ')}
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Record ID: {formData.id.slice(0, 10)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* BODY */}
        <form
          onSubmit={handleUpdate}
          className="flex-1 overflow-y-auto px-6 py-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT */}
            <div className="space-y-6">

              {/* Customer or Business Client */}
              {detailsKind === 'ONE_TIME' ? (
                <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-5">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Customer Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <InputField
                      icon={User}
                      placeholder="Customer Name"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                    />

                    <InputField
                      icon={Phone}
                      placeholder="Phone Number"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                    />

                    <InputField
                      icon={Mail}
                      placeholder="Email Address"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                    />
                    <InputField
                      icon={User}
                      placeholder="Reference"
                      name="customerReference"
                      value={formData.customerReference}
                      onChange={handleChange}
                    />
                  </div>
                </section>
              ) : (
                <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Business Client
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {clients.find(c => c.id === record?.record?.clientId)?.businessName || 'Unknown Business'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {clients.find(c => c.id === record?.record?.clientId)?.email || 'No email provided'}
                    </p>
                  </div>
                </section>
              )}

              {/* Notes */}
              <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <StickyNote className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Internal Notes
                  </h3>
                </div>

                <textarea
                  rows={5}
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add notes..."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </section>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">

              {/* Financial */}
              <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-5">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Payment Details
                  </h3>
                </div>

                <div className="space-y-4">

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                      Payment Amount
                    </label>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        ₹
                      </span>

                      <input
                        type="number"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleChange}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">

                    <SelectField
                      label="Payment Mode"
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleChange}
                      options={PAYMENT_MODES}
                    />

                    <SelectField
                      label="Payment Status"
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                      options={PAYMENT_STATUS_OPTIONS}
                    />

                    <SelectField
                      label="Work Status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      options={STATUS_OPTIONS}
                    />

                  </div>
                </div>
              </section>

              {/* Service Details conditionally rendered */}
              {(() => {
                if (detailsKind === 'GST' || ['GST_3B', 'GST_1'].includes(record?.record?.serviceType)) {
                  return (
                    <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-5">
                        <Calendar className="w-4 h-4 text-violet-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          GST Details
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <InputField
                          label="Party Name"
                          icon={Briefcase}
                          placeholder="Party Name"
                          name="partyName"
                          value={formData.partyName || clients.find(c => c.id === record?.record?.clientId)?.businessName || ''}
                          onChange={handleChange}
                          disabled={true}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <SelectField
                            label="Month"
                            name="gstMonth"
                            value={formData.gstMonth}
                            onChange={handleChange}
                            options={MONTHS.map((m, i) => ({
                              value: String(i + 1),
                              label: m,
                            }))}
                          />

                          <InputField
                            label="Year"
                            icon={Hash}
                            placeholder="Year"
                            name="gstYear"
                            value={formData.gstYear}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </section>
                  );
                }

                if (detailsKind === 'EXTRA_EXPENSE' || record?.record?.serviceType === 'EXTRA_EXPENSE') {
                  return (
                    <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-5">
                        <Briefcase className="w-4 h-4 text-rose-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Extra Expense Details
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <InputField
                          icon={StickyNote}
                          placeholder="Expense Title"
                          name="expenseTitle"
                          value={formData.expenseTitle}
                          onChange={handleChange}
                        />

                        <InputField
                          icon={Info}
                          placeholder="Category"
                          name="expenseCategory"
                          value={formData.expenseCategory}
                          onChange={handleChange}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <SelectField
                            label="Month"
                            name="expenseMonth"
                            value={formData.expenseMonth}
                            onChange={handleChange}
                            options={MONTHS.map((m, i) => ({
                              value: String(i + 1),
                              label: m,
                            }))}
                          />

                          <InputField
                            label="Year"
                            icon={Hash}
                            placeholder="Year"
                            name="expenseYear"
                            value={formData.expenseYear}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </section>
                  );
                }

                if (detailsKind !== 'ONE_TIME') {
                  return (
                    <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-5">
                        <Briefcase className="w-4 h-4 text-violet-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Service Details
                        </h3>
                      </div>

                      <div className="space-y-4">
                        <InputField
                          icon={Info}
                          placeholder="Detail X"
                          name="detailX"
                          value={formData.detailX}
                          onChange={handleChange}
                        />
                        <InputField
                          icon={Info}
                          placeholder="Detail Y"
                          name="detailY"
                          value={formData.detailY}
                          onChange={handleChange}
                        />
                      </div>
                    </section>
                  );
                }

                return null;
              })()}

              {/* Preview */}
              <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Live Preview
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {previewText}
                </p>
              </div>

            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-4">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />

              <p className="text-sm text-rose-700 dark:text-rose-300">
                {error}
              </p>
            </div>
          )}

          {/* FOOTER */}
          <div className="sticky bottom-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-col sm:flex-row justify-between gap-4">

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Record
            </button>

            <div className="flex gap-3">

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdate}
                disabled={isLoading || isDeleting}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />

                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({
  icon: Icon,
  placeholder,
  name,
  value,
  onChange,
  label,
  disabled,
}) => (
  <div className="w-full">
    {label && (
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
        {label}
      </label>
    )}
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
          disabled ? 'opacity-70 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : ''
        }`}
      />
    </div>
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
}) => (
  <div>
    <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
      {label}
    </label>

    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
