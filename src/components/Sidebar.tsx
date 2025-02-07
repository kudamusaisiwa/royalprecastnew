import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  ClipboardList,
  Package,
  Activity,
  UserPlus,
  BarChart3,
  LogOut,
  X,
  Truck,
  CreditCard,
  HelpCircle,
  MessageSquare,
  MapPin,
  Archive,
  Box,
  CheckSquare,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { logout } = useAuthStore();
  const { canViewUsers, canAccessReports, canManagePayments } = usePermissions();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { name: 'Customers', icon: Users, href: '/customers' },
    { name: 'Create Order', icon: PlusCircle, href: '/orders' },
    { name: 'All Orders', icon: ClipboardList, href: '/orders/all' },
    { name: 'My Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Payments', icon: CreditCard, href: '/payments', show: canManagePayments },
    { name: 'Products', icon: Package, href: '/products' },
    { name: 'Activities', icon: Activity, href: '/activities' },
    { name: 'Customer Feedback', icon: MessageSquare, href: '/feedback' },
    { name: 'Deliveries', icon: Truck, href: '/deliveries' },
    { name: 'Site Visits', icon: MapPin, href: '/site-visits' },
    { name: 'Collections', icon: Box, href: '/collections' },
    { name: 'Chat', icon: MessageSquare, href: '/chat' },
    { name: 'Users', icon: UserPlus, href: '/users', show: canViewUsers },
    { name: 'Reports', icon: BarChart3, href: '/reports', show: canAccessReports },
    { name: 'Settings', icon: Settings, href: '/settings' },
    { name: 'Help', icon: HelpCircle, href: '/help' }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:sticky top-0 md:top-16 md:translate-x-0 z-30 h-[calc(100vh-4rem)] w-64 transition-transform duration-200 ease-in-out overflow-y-auto`}
      >
        <div className="flex h-full flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="md:hidden p-4 flex justify-end">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              if (item.show === false) return null;

              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}