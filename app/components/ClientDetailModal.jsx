'use client';

import { X, Pencil, MapPin, FileText, Building2 } from 'lucide-react';
import { getStatusColor } from '@/lib/utils';
import { ServiceBadge } from './ServiceBadge';

export const ClientDetailModal = ({ client, onClose, onEdit }) => {
  if (!client) return null;

  const name = client.fullName || client.businessName || 'Unnamed Client';
  const serviceCount = client.serviceRecords?.length || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden max-h-[95vh] flex flex-col">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Client Details</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${client.type === 'ONE_TIME_CUSTOMER' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                {client.type === 'ONE_TIME_CUSTOMER' ? 'One-Time' : 'Business'}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{client.email}</p>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Name</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Email</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.email || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Phone</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.phone || client.businessPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">GST ID</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.gstId || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">PAN ID</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.panId || '-'}</p>
                </div>
              </div>
            </section>

            <section className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Contact & Address</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Contact Person</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.contactPersonName || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Contact Phone</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.contactPersonPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Contact Email</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{client.contactPersonEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">Address</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    {[client.addressStreet, client.addressCity, client.addressState, client.addressPincode].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Service Records</h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{serviceCount} total</span>
            </div>

            {serviceCount === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No service records found for this client.</p>
            ) : (
              <div className="space-y-3">
                {client.serviceRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-4 py-3">
                    <div>
                      <ServiceBadge type={record.serviceType} />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{new Date(record.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200 dark:shadow-none uppercase tracking-wider"
          >
            <Pencil className="w-4 h-4" />
            Edit Client
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors uppercase tracking-wider"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
