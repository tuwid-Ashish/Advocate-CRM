'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

const ONE_TIME_SERVICES = [
  { value: 'PAN', label: 'PAN' },
  { value: 'TAN', label: 'TAN' },
];

const BUSINESS_SERVICES = [
  { value: 'GST', label: 'GST' },
  { value: 'ITR', label: 'ITR' },
  { value: 'TDS', label: 'TDS' },
  { value: 'DSC', label: 'DSC' },
];

const GST_TYPES = [
  { value: 'GST_3B', label: 'GST 3B' },
  { value: 'GST_1', label: 'GST 1' },
];

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CREDIT', label: 'Credit' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
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

const INITIAL_FORM = {
  recordKind: 'ONE_TIME',
  oneTimeService: 'PAN',
  businessService: 'GST',
  gstType: 'GST_3B',
  clientId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  detailX: '',
  detailY: '',
  partyName: '',
  gstMonth: String(new Date().getMonth() + 1),
  gstYear: String(new Date().getFullYear()),
  filingDate: '',
  paymentAmount: '',
  paymentMode: 'CASH',
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  };

  const createOneTimeClient = async () => {
    const existingClient = clients.find(
      (client) => client.email?.toLowerCase() === formData.customerEmail.trim().toLowerCase()
    );

    if (existingClient) {
      return existingClient.id;
    }

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

    if (formData.recordKind === 'ONE_TIME') {
      return {
        clientId,
        serviceType: formData.oneTimeService,
        paymentAmount,
        paymentMode: formData.paymentMode,
        status: formData.status,
        details: {
          kind: 'ONE_TIME',
          customerName: formData.customerName.trim(),
          phone: formData.customerPhone.trim(),
          email: formData.customerEmail.trim(),
        },
        notes: formData.notes.trim(),
      };
    }

    if (formData.businessService === 'GST') {
      const monthNumber = Number(formData.gstMonth);
      return {
        clientId,
        serviceType: formData.gstType,
        paymentAmount,
        paymentMode: formData.paymentMode,
        status: formData.status,
        details: {
          kind: 'GST',
          partyName: formData.partyName.trim(),
          gstType: formData.gstType,
          month: MONTHS[monthNumber - 1],
          monthNumber,
          year: Number(formData.gstYear),
          filingDate: formData.filingDate || null,
        },
        notes: formData.notes.trim(),
      };
    }

    return {
      clientId,
      serviceType: formData.businessService,
      paymentAmount,
      paymentMode: formData.paymentMode,
      status: formData.status,
      details: {
        kind: 'SIMPLE_BUSINESS',
        x: formData.detailX.trim(),
        y: formData.detailY.trim(),
      },
      notes: formData.notes.trim(),
    };
  };

  const validate = () => {
    if (formData.recordKind === 'ONE_TIME') {
      if (!formData.customerName.trim()) return 'Customer name is required';
      if (!formData.customerEmail.trim()) return 'Customer email is required';
      return '';
    }

    if (!formData.clientId) return 'Please select a business client';

    if (formData.businessService === 'GST') {
      if (!formData.partyName.trim()) return 'Party name is required for GST';
      if (!formData.gstYear || Number(formData.gstYear) < 2000) return 'Enter a valid GST year';
      return '';
    }

    if (!formData.detailX.trim()) return 'First detail is required';
    if (!formData.detailY.trim()) return 'Second detail is required';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const clientId =
        formData.recordKind === 'ONE_TIME' ? await createOneTimeClient() : formData.clientId;

      await postJson('/api/records', buildRecordPayload(clientId));
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create service record');
      console.error('Error creating record:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedBusinessClient = businessClients.find((client) => client.id === formData.clientId);
  const selectedServiceLabel =
    formData.recordKind === 'ONE_TIME'
      ? ONE_TIME_SERVICES.find((item) => item.value === formData.oneTimeService)?.label
      : BUSINESS_SERVICES.find((item) => item.value === formData.businessService)?.label;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full shadow-xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Service Record</h2>
            <p className="text-sm text-gray-500 mt-1">One-time PAN/TAN or recurring business work</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isLoading}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((current) => ({ ...current, recordKind: 'ONE_TIME' }))}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  formData.recordKind === 'ONE_TIME'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                One-Time PAN/TAN
              </button>
              <button
                type="button"
                onClick={() => setFormData((current) => ({ ...current, recordKind: 'BUSINESS' }))}
                className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                  formData.recordKind === 'BUSINESS'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Business GST/ITR/TDS/DSC
              </button>
            </div>
          </div>

          {formData.recordKind === 'ONE_TIME' ? (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    name="oneTimeService"
                    value={formData.oneTimeService}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ONE_TIME_SERVICES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Customer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Client *</label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select business</option>
                    {businessClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.businessName || client.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
                  <select
                    name="businessService"
                    value={formData.businessService}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BUSINESS_SERVICES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.businessService === 'GST' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
                    <input
                      type="text"
                      name="partyName"
                      value={formData.partyName}
                      onChange={handleChange}
                      placeholder={selectedBusinessClient?.businessName || 'Party name'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Type *</label>
                    <select
                      name="gstType"
                      value={formData.gstType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {GST_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                    <select
                      name="gstMonth"
                      value={formData.gstMonth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      name="gstYear"
                      value={formData.gstYear}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
                    <input
                      type="date"
                      name="filingDate"
                      value={formData.filingDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X *</label>
                    <input
                      type="text"
                      name="detailX"
                      value={formData.detailX}
                      onChange={handleChange}
                      placeholder="x"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y *</label>
                    <input
                      type="text"
                      name="detailY"
                      value={formData.detailY}
                      onChange={handleChange}
                      placeholder="y"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount *</label>
              <input
                type="number"
                name="paymentAmount"
                value={formData.paymentAmount}
                onChange={handleChange}
                placeholder="200"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PAYMENT_MODES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
            Preview:{' '}
            {formData.businessService !== 'GST' && formData.recordKind === 'BUSINESS'
              ? `${formData.detailX || 'x'} from ${formData.detailY || 'y'} Rs ${formData.paymentAmount || '0'} ${
                  PAYMENT_MODES.find((mode) => mode.value === formData.paymentMode)?.label || 'Cash'
                }`
              : `${selectedServiceLabel} Rs ${formData.paymentAmount || '0'} ${
                  PAYMENT_MODES.find((mode) => mode.value === formData.paymentMode)?.label || 'Cash'
                }`}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Optional notes"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        <div className="flex flex-col sm:flex-row gap-3 p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};
