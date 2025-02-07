import React, { useState } from 'react';
import { CreditCard, Calendar, Plus } from 'lucide-react';
import { usePaymentStore } from '../../store/paymentStore';
import { usePermissions } from '../../hooks/usePermissions';
import PaymentMethodModal from '../modals/PaymentMethodModal';
import { useToast } from '../ui/use-toast';
import type { PaymentMethod } from '../../types';

interface PaymentHistoryProps {
  orderId: string;
  totalAmount: number;
  paidAmount?: number;
}

export default function PaymentHistory({ orderId, totalAmount, paidAmount }: PaymentHistoryProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  const { getPaymentsByOrder, getTotalPaidForOrder, addPayment } = usePaymentStore();
  const { canManagePayments } = usePermissions();

  const payments = getPaymentsByOrder(orderId);
  const totalPaid = paidAmount !== undefined ? paidAmount : getTotalPaidForOrder(orderId);
  const remainingBalance = totalAmount - totalPaid;
  const paymentProgress = (totalPaid / totalAmount) * 100;

  const handleAddPayment = async (method: PaymentMethod, amount: number, notes?: string, reference?: string) => {
    try {
      await addPayment({
        orderId,
        amount,
        method,
        notes,
        reference,
        date: new Date()
      });

      toast({
        title: "Success",
        description: "Payment added successfully",
      });
      setShowPaymentModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to add payment',
        variant: "destructive",
      });
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      case 'ecocash':
        return 'EcoCash';
      case 'innbucks':
        return 'InnBucks';
      default:
        return method;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h3>
          {canManagePayments && remainingBalance > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="font-medium text-gray-900 dark:text-white">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Total Paid</p>
            <p className="font-medium text-green-600 dark:text-green-400">${totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Remaining</p>
            <p className="font-medium text-red-600 dark:text-red-400">${remainingBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {paymentProgress.toFixed(1)}% paid
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {payments.map((payment) => (
          <div key={payment.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {getPaymentMethodIcon(payment.method)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.reference ? `Ref: ${payment.reference}` : 'No reference'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  ${payment.amount.toFixed(2)}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {payment.date.toLocaleDateString()}
                </div>
              </div>
            </div>
            {payment.notes && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {payment.notes}
              </p>
            )}
          </div>
        ))}
        {payments.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No payments recorded yet
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentMethodModal
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleAddPayment}
          remainingAmount={remainingBalance}
          paidAmount={totalPaid}
        />
      )}
    </div>
  );
}