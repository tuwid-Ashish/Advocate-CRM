'use client';

import { FileText, LayoutDashboard, LogOut, Settings, Users, X } from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onTabChange,
  userRole,
  userName = 'User',
  onLogout,
  isOpen = true,
  onClose,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'records', label: 'Service Records', icon: FileText },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'clients', label: 'Clients', icon: Users });
    menuItems.push({ id: 'employees', label: 'Employees', icon: Settings });
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-gray-900 text-white flex flex-col h-screen transform transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 lg:p-6 border-b border-gray-800">
          <div className="flex items-center justify-between lg:block">
            <div>
              <h1 className="text-lg lg:text-xl font-bold">CA Services</h1>
              <p className="text-xs text-gray-400 mt-1">Management System</p>
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

        <div className="p-4 border-b border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Signed in as</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {userRole === 'admin' ? 'Administrator' : 'Employee'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
