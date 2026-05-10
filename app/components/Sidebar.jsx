'use client';

import { FileText, LayoutDashboard, LogOut, Settings, Users, X } from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onTabChange,
  userRole,
  userName = 'User',
  onLogout,
  isOpen = true,
  isCollapsed = false,
  onToggleCollapse,
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
        className={`fixed inset-y-0 left-0 z-40 bg-gray-900 text-white flex flex-col h-screen transform transition-all duration-300 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 max-w-[85vw] lg:w-56'}`}
      >
        <div className={`p-4 border-b border-gray-800 shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center justify-between">
            <div className={isCollapsed ? 'hidden' : 'block'}>
              <h1 className="text-lg font-bold truncate">Finance</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Management</p>
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

        <div className={`px-3 py-3 border-b border-gray-800 shrink-0`}>
          <div className={`bg-gray-800 rounded-lg transition-all ${isCollapsed ? 'p-1.5' : 'p-2.5'}`}>
            <p className={`text-[10px] text-gray-500 uppercase tracking-widest mb-2 ${isCollapsed ? 'hidden' : 'block'}`}>User</p>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-gray-400">
                    {userRole === 'admin' ? 'Admin' : 'Staff'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={isCollapsed ? item.label : ''}
                  onClick={() => {
                    onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full flex items-center rounded-lg transition-all text-sm font-medium ${
                    isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            title={isCollapsed ? 'Logout' : ''}
            className={`w-full flex items-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-all text-sm font-medium ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
            }`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
