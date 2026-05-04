'use client';

import { BarChart3, Home, LogOut, Settings, Users, X } from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onTabChange,
  userRole,
  onRoleChange,
  isOpen = true,
  onClose,
}) => {
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: BarChart3,
    },
  ];

  if (userRole === 'admin') {
    tabs.push({
      id: 'employees',
      label: 'Employees',
      icon: Users,
    });
  }

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col h-screen transform transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      {/* Logo */}
      <div className="p-4 lg:p-6 border-b border-gray-800">
        <div className="flex items-center justify-between lg:block">
          <div>
            <h1 className="text-lg lg:text-xl font-bold">Adovcrm</h1>
            <p className="text-xs text-gray-400 mt-1">Transaction Manager</p>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-300 hover:bg-gray-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Role */}
      <div className="p-4 border-b border-gray-800">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">Current Role</p>
          <div className="flex gap-2">
            {['admin', 'employee'].map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                  userRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {role === 'admin' ? 'Admin (CA)' : 'Employee'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
      </div>
    </>
  );
};
