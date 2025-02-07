import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Truck, Package, Download } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import DateRangePicker from '../components/DateRangePicker';
import { exportDeliveryData } from '../utils/exportDeliveries';
import Toast from '../components/ui/Toast';

export default function DeliveryCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { orders } = useOrderStore();
  const { getCustomerById } = useCustomerStore();

  const getOrdersForDate = (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const deliveries = orders.filter(order => {
      if (!order.deliveryDate) return false;
      const deliveryDate = new Date(order.deliveryDate);
      return order.deliveryMethod === 'delivery' && 
             deliveryDate >= startOfDay && 
             deliveryDate <= endOfDay;
    });

    const collections = orders.filter(order => {
      if (!order.collectionDate) return false;
      const collectionDate = new Date(order.collectionDate);
      return order.deliveryMethod === 'collection' && 
             collectionDate >= startOfDay && 
             collectionDate <= endOfDay;
    });

    return { deliveries, collections };
  };

  const handleDateClick = (date: Date) => {
    // Create a new date for the next day
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    
    // Navigate to the next day's view
    navigate(`/deliveries/${nextDay.toISOString().split('T')[0]}`);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setTimeRange('custom');
    setShowDatePicker(false);

    // Export data for selected range
    const ordersInRange = getOrdersForDate(startDate);
    exportDeliveryData(ordersInRange, startDate, endDate, getCustomerById);
    
    setToastMessage('Delivery data exported successfully');
    setToastType('success');
    setShowToast(true);
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];
    const today = new Date();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const { deliveries, collections } = getOrdersForDate(date);
      const isToday = date.toDateString() === today.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          className={`h-24 p-2 border border-gray-200 dark:border-gray-700 relative text-left hover:bg-blue-50 dark:hover:bg-blue-900/50 cursor-pointer ${
            isToday ? 'bg-blue-50 dark:bg-blue-900/30' : ''
          }`}
        >
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {day}
          </span>
          {deliveries.length > 0 && (
            <div className="mt-1 flex items-center text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded px-1 py-0.5">
              <Truck className="h-3 w-3 mr-1" />
              {deliveries.length} {deliveries.length === 1 ? 'Delivery' : 'Deliveries'}
            </div>
          )}
          {collections.length > 0 && (
            <div className="mt-1 flex items-center text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 rounded px-1 py-0.5">
              <Package className="h-3 w-3 mr-1" />
              {collections.length} {collections.length === 1 ? 'Collection' : 'Collections'}
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Delivery Calendar</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDatePicker(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Range
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
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
      </div>

      {showDatePicker && (
        <DateRangePicker
          onSelect={handleDateRangeSelect}
          onClose={() => setShowDatePicker(false)}
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
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