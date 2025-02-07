import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Edit, Trash2 } from 'lucide-react';
import type { Customer } from '../../types';

interface CustomerTableRowProps {
  customer: Customer;
  canManageCustomers: boolean;
  onEditClick: (customerId: string) => void;
  onDeleteClick: (customerId: string) => void;
}

export default function CustomerTableRow({
  customer,
  canManageCustomers,
  onEditClick,
  onDeleteClick
}: CustomerTableRowProps) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          to={`/customers/${customer.id}`}
          className="flex items-start"
        >
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {customer.firstName} {customer.lastName}
            </div>
            {customer.companyName && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {customer.companyName}
              </div>
            )}
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Mail className="h-4 w-4 mr-2" />
            {customer.email}
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Phone className="h-4 w-4 mr-2" />
            {customer.phone}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {customer.totalOrders || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        ${(customer.totalRevenue || 0).toLocaleString()}
      </td>
      {canManageCustomers && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onEditClick(customer.id)}
              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteClick(customer.id)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}