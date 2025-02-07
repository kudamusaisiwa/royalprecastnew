import React, { useState, useEffect } from 'react';
import { Calendar, Truck, AlertTriangle } from 'lucide-react';
import { useDeliveryStore } from '../../store/deliveryStore';
import type { Order, DeliverySchedule } from '../../types';
import Toast from '../ui/Toast';

interface DeliverySchedulerProps {
  order: Order;
}

const initialFormState = {
  scheduledDate: new Date().toISOString().split('T')[0],
  quantity: 0.1,
  deliveryAddress: '',
  contactPerson: '',
  contactPhone: '',
  notes: ''
};

export default function DeliveryScheduler({ order }: DeliverySchedulerProps) {
  const { addDeliverySchedule, updateDeliveryStatus, getSchedulesByOrder } = useDeliveryStore();
  const [showScheduler, setShowScheduler] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [scheduleData, setScheduleData] = useState({
    ...initialFormState,
    deliveryAddress: order?.deliveryMethod === 'delivery' ? order.customerAddress : ''
  });

  const schedules = getSchedulesByOrder(order.id);
  const totalScheduledQuantity = schedules.reduce((sum, schedule) => sum + schedule.quantity, 0);
  const totalOrderQuantity = order.products.reduce((sum, product) => sum + product.quantity, 0);
  const remainingQuantity = totalOrderQuantity - totalScheduledQuantity;

  // Initialize form data when component mounts or order changes
  useEffect(() => {
    if (order) {
      setScheduleData({
        ...initialFormState,
        deliveryAddress: order.deliveryMethod === 'delivery' ? order.customerAddress : ''
      });
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scheduleData.quantity > remainingQuantity) {
      setToastMessage('Scheduled quantity exceeds remaining order quantity');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      await addDeliverySchedule({
        orderId: order.id,
        scheduledDate: new Date(scheduleData.scheduledDate),
        quantity: scheduleData.quantity,
        status: 'scheduled',
        deliveryAddress: scheduleData.deliveryAddress,
        contactPerson: scheduleData.contactPerson,
        contactPhone: scheduleData.contactPhone,
        notes: scheduleData.notes || ''
      });

      setToastMessage('Delivery scheduled successfully');
      setToastType('success');
      setShowToast(true);
      setShowScheduler(false);
      
      // Reset form to initial state with current date
      setScheduleData({
        ...initialFormState,
        deliveryAddress: order.deliveryMethod === 'delivery' ? order.customerAddress : ''
      });
    } catch (error) {
      setToastMessage('Failed to schedule delivery');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleStatusUpdate = async (scheduleId: string, newStatus: DeliverySchedule['status']) => {
    try {
      await updateDeliveryStatus(scheduleId, newStatus);
      setToastMessage('Delivery status updated successfully');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage('Failed to update delivery status');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Delivery Schedule</h3>
        {remainingQuantity > 0 && (
          <button
            onClick={() => setShowScheduler(!showScheduler)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="h-4 w-4 mr-2" />
            Schedule Delivery
          </button>
        )}
      </div>

      {showScheduler && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Scheduled Date
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                className="modern-input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity (Remaining: {remainingQuantity})
              </label>
              <input
                type="number"
                required
                min="0.1"
                step="0.1"
                max={remainingQuantity}
                value={scheduleData.quantity}
                onChange={(e) => setScheduleData({ ...scheduleData, quantity: parseFloat(e.target.value) || 0.1 })}
                className="modern-input mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Delivery Address
            </label>
            <input
              type="text"
              required
              value={scheduleData.deliveryAddress}
              onChange={(e) => setScheduleData({ ...scheduleData, deliveryAddress: e.target.value })}
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
                value={scheduleData.contactPerson}
                onChange={(e) => setScheduleData({ ...scheduleData, contactPerson: e.target.value })}
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
                value={scheduleData.contactPhone}
                onChange={(e) => setScheduleData({ ...scheduleData, contactPhone: e.target.value })}
                className="modern-input mt-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={scheduleData.notes}
              onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
              className="modern-textarea mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowScheduler(false)}
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
      )}

      {schedules.length > 0 ? (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="font-medium">
                    {schedule.scheduledDate.toLocaleDateString()}
                  </span>
                </div>
                <select
                  value={schedule.status}
                  onChange={(e) => handleStatusUpdate(schedule.id, e.target.value as DeliverySchedule['status'])}
                  className="modern-select text-sm py-1"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-transit">In Transit</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Quantity</p>
                  <p className="font-medium">{schedule.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact</p>
                  <p className="font-medium">{schedule.contactPerson}</p>
                  <p className="text-gray-600">{schedule.contactPhone}</p>
                </div>
              </div>
              {schedule.notes && (
                <div className="text-sm">
                  <p className="text-gray-500">Notes</p>
                  <p className="text-gray-700">{schedule.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No deliveries scheduled yet</p>
      )}

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}