'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const INITIAL_FORM = {
  businessName: '',
  email: '',
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

export const AddClientModal = ({ isOpen, onClose, token, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Primary email is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'BUSINESS_CLIENT',
          businessName: formData.businessName.trim(),
          email: formData.email.trim(),
          businessEmail: formData.businessEmail.trim() || formData.email.trim(),
          businessPhone: formData.businessPhone.trim(),
          gstId: formData.gstId.trim(),
          panId: formData.panId.trim(),
          addressStreet: formData.addressStreet.trim(),
          addressCity: formData.addressCity.trim(),
          addressState: formData.addressState.trim(),
          addressPincode: formData.addressPincode.trim(),
          contactPersonName: formData.contactPersonName.trim(),
          contactPersonPhone: formData.contactPersonPhone.trim(),
          contactPersonEmail: formData.contactPersonEmail.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create business client');
      }

      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create business client');
      console.error('Error creating client:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Business Client</h2>
            <p className="text-sm text-gray-500 mt-1">Maintain the fixed businesses handled by the office</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Sai Traders"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="accounts@business.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
              <input
                type="email"
                name="businessEmail"
                value={formData.businessEmail}
                onChange={handleChange}
                placeholder="Optional if same as primary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
              <input
                type="tel"
                name="businessPhone"
                value={formData.businessPhone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST ID</label>
              <input
                type="text"
                name="gstId"
                value={formData.gstId}
                onChange={handleChange}
                placeholder="18AABCU1234F1Z5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN ID</label>
              <input
                type="text"
                name="panId"
                value={formData.panId}
                onChange={handleChange}
                placeholder="AAABR5055K"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                name="contactPersonPhone"
                value={formData.contactPersonPhone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                name="contactPersonEmail"
                value={formData.contactPersonEmail}
                onChange={handleChange}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-gray-100 pt-5">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input
                type="text"
                name="addressStreet"
                value={formData.addressStreet}
                onChange={handleChange}
                placeholder="123 Market Street"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="addressCity"
                value={formData.addressCity}
                onChange={handleChange}
                placeholder="Bangalore"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="addressState"
                value={formData.addressState}
                onChange={handleChange}
                placeholder="KA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                name="addressPincode"
                value={formData.addressPincode}
                onChange={handleChange}
                placeholder="560001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            {isLoading ? 'Saving...' : 'Save Business'}
          </button>
        </div>
      </div>
    </div>
  );
};
