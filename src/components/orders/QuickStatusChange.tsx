import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useOrderStore } from '../../store/orderStore';
import { useActivityStore } from '../../store/activityStore';
import { canChangeToStatus } from '../../hooks/usePermissions';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentMethodModal from '../modals/PaymentMethodModal';
import StatusWarningModal from '../modals/StatusWarningModal';
import { useToast } from '../ui/use-toast';
import type { OrderStatus, PaymentMethod } from '../../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickStatusChangeProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export default function QuickStatusChange({ orderId, currentStatus }: QuickStatusChangeProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const { toast } = useToast();

  const { user } = useAuthStore();
  const { updateOrderStatus, getOrderById } = useOrderStore();

  const order = getOrderById(orderId);
  const remainingAmount = order ? order.totalAmount - (order.totalPaid || 0) : 0;

  const statuses: OrderStatus[] = [
    'quotation',
    'paid',
    'production',
    'quality_control',
    'dispatch',
    'installation',
    'completed'
  ];

  const handleStatusSelect = async (newStatus: OrderStatus) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to change order status",
          variant: "destructive",
        });
        return;
      }

      // Check if user has permission to make this status change
      if (!canChangeToStatus(currentStatus, newStatus, user.role)) {
        toast({
          title: "Error",
          description: "You do not have permission to make this status change",
          variant: "destructive",
        });
        return;
      }

      // Special handling for reverting from paid status
      if (currentStatus === 'paid' && newStatus !== 'paid') {
        setPendingStatus(newStatus);
        setShowWarningModal(true);
        return;
      }

      // Special handling for changing to paid status
      if (newStatus === 'paid') {
        setPendingStatus(newStatus);
        setShowPaymentModal(true);
        return;
      }

      await handleStatusChange(newStatus);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update status',
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus, paymentMethod?: PaymentMethod, paymentAmount?: number, paymentNotes?: string) => {
    try {
      await updateOrderStatus(orderId, newStatus, paymentMethod, paymentAmount, paymentNotes);
      toast({
        title: "Success",
        description: paymentAmount ? 'Payment added successfully' : `Order status updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update status',
        variant: "destructive",
      });
    }
    setShowPaymentModal(false);
    setShowWarningModal(false);
    setPendingStatus(null);
  };

  const handlePaymentConfirm = (method: PaymentMethod, amount: number, notes?: string) => {
    if (pendingStatus) {
      handleStatusChange(pendingStatus, method, amount, notes);
    }
    setShowPaymentModal(false);
  };

  const handleWarningConfirm = () => {
    if (pendingStatus) {
      handleStatusChange(pendingStatus);
    }
    setShowWarningModal(false);
  };

  const getStatusLabel = (status: OrderStatus): string => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="relative">
      <Select
        value={currentStatus}
        onValueChange={handleStatusSelect}
      >
        <SelectTrigger className="w-[180px] bg-transparent border-0 p-0 h-auto hover:bg-transparent focus:ring-0">
          <SelectValue>
            <OrderStatusBadge status={currentStatus} />
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem
              key={status}
              value={status}
              disabled={!canChangeToStatus(currentStatus, status, user?.role)}
            >
              <OrderStatusBadge status={status} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showPaymentModal && (
        <PaymentMethodModal
          onClose={() => {
            setShowPaymentModal(false);
            setPendingStatus(null);
          }}
          onSubmit={handlePaymentConfirm}
          remainingAmount={remainingAmount}
          paidAmount={order?.totalPaid || 0}
        />
      )}

      {showWarningModal && (
        <StatusWarningModal
          isOpen={showWarningModal}
          onClose={() => {
            setShowWarningModal(false);
            setPendingStatus(null);
          }}
          onConfirm={handleWarningConfirm}
          message="Are you sure you want to change the status from 'paid'? This action cannot be undone."
        />
      )}
    </div>
  );
}