import React, { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import { useDeliveryStore } from '../../store/deliveryStore';
import type { Order } from '../../types';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  selectedDate: Date;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function DeliveryModal({
  isOpen,
  onClose,
  order,
  selectedDate,
  onSuccess,
  onError
}: DeliveryModalProps) {
  const { addDeliverySchedule, getSchedulesByOrder } = useDeliveryStore();
  const [formData, setFormData] = useState({
    quantity: 1,
    deliveryAddress: '',
    contactPerson: '',
    contactPhone: '',
    notes: ''
  });

  // Initialize form data when component mounts or order changes
  useEffect(() => {
    if (order) {
      setFormData(prev => ({
        ...prev,
        deliveryAddress: order.deliveryMethod === 'delivery' ? order.customerAddress : ''
      }));
    }
  }, [order]);

  const schedules = getSchedulesByOrder(order.id);
  const totalScheduledQuantity = schedules.reduce((sum, schedule) => sum + schedule.quantity, 0);
  const totalOrderQuantity = order.products.reduce((sum, product) => sum + product.quantity, 0);
  const remainingQuantity = totalOrderQuantity - totalScheduledQuantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.quantity > remainingQuantity) {
      onError('Scheduled quantity exceeds remaining order quantity');
      return;
    }

    try {
      await addDeliverySchedule({
        orderId: order.id,
        scheduledDate: selectedDate,
        quantity: formData.quantity,
        status: 'scheduled',
        deliveryAddress: formData.deliveryAddress,
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        notes: formData.notes
      });

      onSuccess('Delivery scheduled successfully');
      onClose();
    } catch (error) {
      onError('Failed to schedule delivery');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <Truck className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Schedule Delivery for {selectedDate.toLocaleDateString()}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity (Remaining: {remainingQuantity})
              </label>
              <input
                type="number"
                required
                min="1"
                max={remainingQuantity}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="modern-input mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Address
              </label>
              <input
                type="text"
                required
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                className="modern-input mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Person
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="modern-input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="modern-input mt-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="modern-textarea mt-1"
                rows={3}
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Schedule Delivery
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}