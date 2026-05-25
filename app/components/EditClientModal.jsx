'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';

const INITIAL_FORM = {
  type: 'BUSINESS_CLIENT',
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  businessEmail: '',
  businessPhone: '',
  gstId: '',
  panId: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPincode: '',
  contactPersonName: '',
  contactPersonPhone: '',
  contactPersonEmail: '',
};

const buildInitialForm = (client) => {
  if (!client) return INITIAL_FORM;

  return {
    type: client.type || 'BUSINESS_CLIENT',
    fullName: client.fullName || '',
    businessName: client.businessName || '',
    email: client.email || '',
    phone: client.phone || '',
    businessEmail: client.businessEmail || '',
    businessPhone: client.businessPhone || '',
    gstId: client.gstId || '',
    panId: client.panId || '',
    addressStreet: client.addressStreet || '',
    addressCity: client.addressCity || '',
    addressState: client.addressState || '',
    addressPincode: client.addressPincode || '',
    contactPersonName: client.contactPersonName || '',
    contactPersonPhone: client.contactPersonPhone || '',
    contactPersonEmail: client.contactPersonEmail || '',
  };
};

export const EditClientModal = ({ isOpen, onClose, onSuccess, client, onDelete }) => {
  const router = useRouter();
  const [formData, setFormData] = useState(INITIAL_FORM);
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

  useEffect(() => {
    if (!isOpen) {
      setError('');
      setIsLoading(false);
      setIsDeleting(false);
      setFormData(INITIAL_FORM);
      return;
    }

    setFormData(buildInitialForm(client));
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!client?.id) {
      setError('Client is missing');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (formData.type === 'ONE_TIME_CUSTOMER' && !formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (formData.type === 'BUSINESS_CLIENT' && !formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        type: formData.type,
        fullName: formData.type === 'ONE_TIME_CUSTOMER' ? formData.fullName.trim() : '',
        businessName: formData.type === 'BUSINESS_CLIENT' ? formData.businessName.trim() : '',
        email: formData.email.trim(),
        phone: formData.type === 'ONE_TIME_CUSTOMER' ? formData.phone.trim() : '',
        businessEmail: formData.type === 'BUSINESS_CLIENT' ? formData.businessEmail.trim() || formData.email.trim() : '',
        businessPhone: formData.type === 'BUSINESS_CLIENT' ? formData.businessPhone.trim() : '',
        gstId: formData.type === 'BUSINESS_CLIENT' ? formData.gstId.trim() : '',
        panId: formData.type === 'BUSINESS_CLIENT' ? formData.panId.trim() : '',
        addressStreet: formData.addressStreet.trim(),
        addressCity: formData.addressCity.trim(),
        addressState: formData.addressState.trim(),
        addressPincode: formData.addressPincode.trim(),
        contactPersonName: formData.type === 'BUSINESS_CLIENT' ? formData.contactPersonName.trim() : '',
        contactPersonPhone: formData.type === 'BUSINESS_CLIENT' ? formData.contactPersonPhone.trim() : '',
        contactPersonEmail: formData.type === 'BUSINESS_CLIENT' ? formData.contactPersonEmail.trim() : '',
      };

      const response = await fetch(`/api/clients/${client.id}`, {
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

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update client');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!client?.id) return;

    const confirmed = window.confirm(
      `Delete ${client.fullName || client.businessName || client.email}? This will remove the client and related service records.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (response.status === 401) {
        await handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to delete client');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete client');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Client</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update client information</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 dark:hover:text-white transition-colors"
            disabled={isLoading || isDeleting}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 p-4 text-sm text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({
                ...prev,
                type: 'ONE_TIME_CUSTOMER',
                businessName: '',
                businessEmail: '',
                businessPhone: '',
                gstId: '',
                panId: '',
                contactPersonName: '',
                contactPersonPhone: '',
                contactPersonEmail: '',
              }))}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${formData.type === 'ONE_TIME_CUSTOMER' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'}`}
            >
              One-Time Customer
            </button>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({
                ...prev,
                type: 'BUSINESS_CLIENT',
                fullName: '',
                phone: '',
              }))}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${formData.type === 'BUSINESS_CLIENT' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'}`}
            >
              Business Client
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formData.type === 'ONE_TIME_CUSTOMER' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Amit Sharma"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Sai Traders"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="accounts@business.com"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Phone</label>
              <input
                type="tel"
                name={formData.type === 'ONE_TIME_CUSTOMER' ? 'phone' : 'businessPhone'}
                value={formData.type === 'ONE_TIME_CUSTOMER' ? formData.phone : formData.businessPhone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            {formData.type === 'BUSINESS_CLIENT' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Business Email</label>
                  <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="Optional if same as primary"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">GST ID</label>
                  <input
                    type="text"
                    name="gstId"
                    value={formData.gstId}
                    onChange={handleChange}
                    placeholder="18AABCU1234F1Z5"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">PAN ID</label>
                  <input
                    type="text"
                    name="panId"
                    value={formData.panId}
                    onChange={handleChange}
                    placeholder="AAABR5055K"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </>
            )}
          </div>

          {formData.type === 'BUSINESS_CLIENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Contact Person</label>
                <input
                  type="text"
                  name="contactPersonName"
                  value={formData.contactPersonName}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPersonPhone"
                  value={formData.contactPersonPhone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Contact Email</label>
                <input
                  type="email"
                  name="contactPersonEmail"
                  value={formData.contactPersonEmail}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Street</label>
              <input
                type="text"
                name="addressStreet"
                value={formData.addressStreet}
                onChange={handleChange}
                placeholder="123 Market Street"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">City</label>
              <input
                type="text"
                name="addressCity"
                value={formData.addressCity}
                onChange={handleChange}
                placeholder="Bangalore"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">State</label>
              <input
                type="text"
                name="addressState"
                value={formData.addressState}
                onChange={handleChange}
                placeholder="KA"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1">Pincode</label>
              <input
                type="text"
                name="addressPincode"
                value={formData.addressPincode}
                onChange={handleChange}
                placeholder="560001"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 font-bold text-xs uppercase tracking-wider"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Client'}
          </button>
          
          <div className="flex w-full sm:w-auto gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading || isDeleting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || isDeleting}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20 dark:shadow-none"
            >
              {isLoading ? 'Saving...' : 'Update Client'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};