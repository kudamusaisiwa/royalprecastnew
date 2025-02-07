import React, { useState } from 'react';
import { Search, Users, Package, CreditCard } from 'lucide-react';
import { useCustomerStore } from '../../store/customerStore';
import { useOrderStore } from '../../store/orderStore';
import { usePaymentStore } from '../../store/paymentStore';

interface AttachmentSearchProps {
  onSelect: (attachment: {
    type: 'customer' | 'order' | 'payment';
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
  }) => void;
  onClose: () => void;
}

export default function AttachmentSearch({ onSelect, onClose }: AttachmentSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers } = useCustomerStore();
  const { orders } = useOrderStore();
  const { payments } = usePaymentStore();
  const { getCustomerById } = useCustomerStore();

  const getFilteredResults = () => {
    const term = searchTerm.toLowerCase();
    const results: Array<{
      type: 'customer' | 'order' | 'payment';
      id: string;
      title: string;
      subtitle?: string;
      amount?: number;
      searchText: string;
      icon: typeof Users;
    }> = [];

    // Search customers
    customers.forEach(customer => {
      const searchText = `${customer.firstName} ${customer.lastName} ${customer.companyName || ''}`.toLowerCase();
      if (searchText.includes(term)) {
        results.push({
          type: 'customer',
          id: customer.id,
          title: `${customer.firstName} ${customer.lastName}`,
          subtitle: customer.companyName,
          searchText,
          icon: Users
        });
      }
    });

    // Search orders
    orders.forEach(order => {
      const customer = getCustomerById(order.customerId);
      const searchText = `order ${order.id} ${customer?.firstName || ''} ${customer?.lastName || ''}`.toLowerCase();
      if (searchText.includes(term)) {
        results.push({
          type: 'order',
          id: order.id,
          title: `Order #${order.id}`,
          subtitle: customer ? `${customer.firstName} ${customer.lastName}` : undefined,
          amount: order.totalAmount,
          searchText,
          icon: Package
        });
      }
    });

    // Search payments
    payments.forEach(payment => {
      const searchText = `payment ${payment.id}`.toLowerCase();
      if (searchText.includes(term)) {
        results.push({
          type: 'payment',
          id: payment.id,
          title: `Payment for Order #${payment.orderId}`,
          amount: payment.amount,
          searchText,
          icon: CreditCard
        });
      }
    });

    return results.slice(0, 5); // Limit to 5 results
  };

  const filteredResults = getFilteredResults();

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search to attach..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
        </div>

        <div className="mt-2 max-h-60 overflow-y-auto">
          {filteredResults.map((result) => {
            const Icon = result.icon;
            return (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => {
                  onSelect({
                    type: result.type,
                    id: result.id,
                    title: result.title,
                    subtitle: result.subtitle,
                    amount: result.amount
                  });
                  onClose();
                }}
                className="w-full px-3 py-2 flex items-start space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Icon className="h-5 w-5 mt-0.5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {result.subtitle}
                    </div>
                  )}
                  {result.amount !== undefined && (
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${result.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
          {searchTerm && filteredResults.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}