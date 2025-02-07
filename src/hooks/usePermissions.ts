import { useAuthStore } from '../store/authStore';
import type { UserRole, OrderStatus } from '../types';

interface Permissions {
  canChangeStatus: boolean;
  canMarkAsPaid: boolean;
  canRevertPaid: boolean;
  canManageUsers: boolean;
  canViewFinancials: boolean;
  canEditProducts: boolean;
  canViewAllActivities: boolean;
  canAccessReports: boolean;
  canDeleteEntities: boolean;
  canManageCustomers: boolean;
  canViewUsers: boolean;
  canManagePayments: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuthStore();
  const role = user?.role || 'staff';

  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isFinance = role === 'finance';
  const isPrivilegedUser = isAdmin || isManager;

  return {
    canChangeStatus: true,
    canMarkAsPaid: isAdmin || isManager || isFinance,
    canRevertPaid: isAdmin || isManager || isFinance,
    canManageUsers: isAdmin,
    canViewFinancials: isAdmin || isManager || isFinance,
    canEditProducts: isPrivilegedUser,
    canViewAllActivities: isPrivilegedUser,
    canAccessReports: isAdmin || isManager || isFinance,
    canDeleteEntities: isPrivilegedUser,
    canManageCustomers: isPrivilegedUser,
    canViewUsers: isAdmin || isManager,
    canManagePayments: isAdmin || isManager || isFinance
  };
}

export function canChangeToStatus(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole: UserRole
): boolean {
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isFinance = userRole === 'finance';

  if (currentStatus === 'paid' || newStatus === 'paid') {
    return isAdmin || isManager || isFinance;
  }

  return true;
}