import React from 'react';
import { usePaymentStore } from '../../store/paymentStore';
import type { OperationalStatus, PaymentStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OperationalStatus;
  orderId?: string;
}

export default function OrderStatusBadge({ status, orderId }: OrderStatusBadgeProps) {
  const { getTotalPaidForOrder } = usePaymentStore();

  const getPaymentStatus = (orderId: string): PaymentStatus => {
    const totalPaid = getTotalPaidForOrder(orderId);
    if (totalPaid === 0) return 'unpaid';
    return totalPaid >= order.totalAmount ? 'paid' : 'partial';
  };

  const getStatusColor = (status: OperationalStatus, paymentStatus?: PaymentStatus): string => {
    // If orderId is provided, check payment status
    if (orderId) {
      const currentPaymentStatus = paymentStatus || getPaymentStatus(orderId);
      if (currentPaymentStatus === 'paid') {
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      }
      if (currentPaymentStatus === 'partial') {
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      }
    }

    switch (status) {
      case 'quotation':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case 'production':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'quality_control':
        return 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300';
      case 'dispatch':
        return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300';
      case 'installation':
        return 'bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: OperationalStatus, paymentStatus?: PaymentStatus): string => {
    if (orderId) {
      const currentPaymentStatus = paymentStatus || getPaymentStatus(orderId);
      if (currentPaymentStatus === 'paid') return 'Paid';
      if (currentPaymentStatus === 'partial') return 'Deposit Paid';
    }

    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
      getStatusColor(status, orderId ? getPaymentStatus(orderId) : undefined)
    }`}>
      {getStatusLabel(status, orderId ? getPaymentStatus(orderId) : undefined)}
    </span>
  );
}