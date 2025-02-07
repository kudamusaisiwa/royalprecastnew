import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import InvoiceView from '../components/orders/InvoiceView';
import EditOrderModal from '../components/modals/EditOrderModal';
import DeleteOrderModal from '../components/modals/DeleteOrderModal';
import Toast from '../components/ui/Toast';
import type { Order, PaymentMethod } from '../types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function OrderDetails() {
  const { toast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const { getOrderById, updateOrder, deleteOrder, updateOrderStatus } = useOrderStore();
  const { getCustomerById } = useCustomerStore();
  const order = getOrderById(id!);

  const handleCopyLink = () => {
    if (!order) return;
    const trackingLink = `${window.location.origin}/track?orderId=${order.id}`;
    navigator.clipboard.writeText(trackingLink);
    setCopied(true);
    toast({
      title: "Link Copied",
      description: "The tracking link has been copied to your clipboard.",
      duration: 3000,
    });
    setTimeout(() => setCopied(false), 3000);
  };

  const handleEdit = async (orderData: Partial<Order>) => {
    try {
      await updateOrder(order!.id, orderData);
      setShowEditModal(false);
      setToastMessage('Order updated successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error updating order:', error);
      setToastMessage('Failed to update order');
      setShowToast(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(order!.id);
      setShowDeleteModal(false);
      navigate('/orders/all');
    } catch (error) {
      console.error('Error deleting order:', error);
      setToastMessage('Failed to delete order');
      setShowToast(true);
    }
  };

  const handleStatusChange = async (status: Order['status'], paymentMethod?: PaymentMethod) => {
    try {
      await updateOrderStatus(order!.id, status, paymentMethod);
    } catch (error) {
      console.error('Error updating status:', error);
      setToastMessage('Failed to update status');
      setShowToast(true);
    }
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Order not found</h2>
          <p className="mt-2 text-gray-600">The order you're looking for doesn't exist.</p>
          <Link
            to="/orders/all"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  // Get customer data
  const customer = getCustomerById(order.customerId);
  if (!customer) return null;

  // Add customer data to order for PDF
  const orderWithCustomer = {
    ...order,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerCompany: customer.companyName || undefined,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerAddress: customer.address
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back to Orders
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-gray-900 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            Copy Tracking Link
          </Button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit Order
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Delete Order
          </button>
        </div>
      </div>

      <InvoiceView 
        order={orderWithCustomer}
        onStatusChange={handleStatusChange}
        showStatusChange={true}
      />

      <EditOrderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEdit}
        order={orderWithCustomer}
      />

      <DeleteOrderModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        orderNumber={order.id}
      />

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}