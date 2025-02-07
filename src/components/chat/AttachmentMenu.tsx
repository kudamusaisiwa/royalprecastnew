import React from 'react';
import { Package, CreditCard } from 'lucide-react';
import { useCustomerStore } from '../../store/customerStore';
import { useOrderStore } from '../../store/orderStore';
import { usePaymentStore } from '../../store/paymentStore';

interface AttachmentMenuProps {
  onSelect: (attachment: {
    type: 'customer' | 'order' | 'payment';
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
  }) => void;
  onClose: () => void;
}

export default function AttachmentMenu({ onSelect, onClose }: AttachmentMenuProps) {
  const { customers } = useCustomerStore();
  const { orders } = useOrderStore();
  const { payments } = usePaymentStore();

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-2 space-y-1">
        <div className="font-medium text-sm text-gray-900 dark:text-white px-2 py-1">
          Attach to message:
        </div>
        
        {/* Orders */}
        <div className="space-y-1">
          <div className="flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            <Package className="h-4 w-4 mr-1" />
            Orders
          </div>
          <div className="max-h-48 overflow-y-auto">
            {orders.slice(0, 10).map(order => {
              const customer = customers.find(c => c.id === order.customerId);
              const customerName = customer 
                ? `${customer.firstName} ${customer.lastName}`
                : 'Unknown Customer';
              return (
                <button
                  key={order.id}
                  onClick={() => {
                    onSelect({
                      type: 'order',
                      id: order.id,
                      title: `Order #${order.id}`,
                      subtitle: customerName,
                      amount: order.totalAmount
                    });
                    onClose();
                  }}
                  className="w-full px-2 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="text-sm text-gray-900 dark:text-white">Order #{order.id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{customerName}</div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    ${order.totalAmount.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payments */}
        <div className="space-y-1">
          <div className="flex items-center px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
            <CreditCard className="h-4 w-4 mr-1" />
            Recent Payments
          </div>
          <div className="max-h-32 overflow-y-auto">
            {payments.slice(0, 5).map(payment => (
              <button
                key={payment.id}
                onClick={() => {
                  onSelect({
                    type: 'payment',
                    id: payment.id,
                    title: `Payment for Order #${payment.orderId}`,
                    amount: payment.amount
                  });
                  onClose();
                }}
                className="w-full px-2 py-1 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div>Payment for Order #{payment.orderId}</div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  ${payment.amount.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}