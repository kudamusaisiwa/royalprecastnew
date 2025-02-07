import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useDeliveryStore } from '../../store/deliveryStore';
import type { Order, DeliverySchedule } from '../../types';
import DeliveryModal from './DeliveryModal';
import Toast from '../ui/Toast';
import { useNavigate } from 'react-router-dom';

interface DeliveryCalendarProps {
  order: Order;
}

export default function DeliveryCalendar({ order }: DeliveryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { getSchedulesByOrder } = useDeliveryStore();
  const schedules = getSchedulesByOrder(order.id);
  const navigate = useNavigate();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleOrderClick = (orderId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering handleDateClick
    navigate(`/orders/${orderId}`);
  };

  const handleSuccess = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
  };

  const handleError = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
  };

  const getDeliveryForDate = (date: Date) => {
    // Check for scheduled deliveries first
    const schedule = schedules.find(schedule => 
      schedule.scheduledDate.toDateString() === date.toDateString()
    );

    if (schedule) return schedule;

    // Check for site visits
    if (order.deliveryMethod === 'site_visit' && order.siteVisitDate) {
      const siteVisitDate = new Date(order.siteVisitDate);
      if (siteVisitDate.toDateString() === date.toDateString()) {
        return {
          scheduledDate: siteVisitDate,
          status: order.siteVisitStatus || 'scheduled',
          quantity: 0 // Not applicable for site visits
        };
      }
    }

    return undefined;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const delivery = getDeliveryForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-24 p-2 border border-gray-200 dark:border-gray-700 relative text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/30' : ''
          } ${
            isPast ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
          }`}
        >
          <span className="text-sm">
            {day}
          </span>
          {delivery && (
            <div 
              onClick={(e) => handleOrderClick(order.id, e)}
              className={`mt-1 p-1 text-xs rounded-md cursor-pointer ${
                delivery.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                delivery.status === 'in-transit' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
              }`}
            >
              {order.deliveryMethod === 'site_visit' ? (
                <div className="flex flex-col">
                  <span className="font-medium">Site Visit</span>
                  <span className="text-xs opacity-75">{delivery.status}</span>
                </div>
              ) : (
                `${delivery.quantity} units`
              )}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delivery Calendar</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <ChevronRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
        {renderCalendar()}
      </div>

      {selectedDate && (
        <DeliveryModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          order={order}
          selectedDate={selectedDate}
          onSuccess={handleSuccess}
          onError={handleError}
        />
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