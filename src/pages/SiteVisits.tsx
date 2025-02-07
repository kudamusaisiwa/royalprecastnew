import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import Toast from '../components/ui/Toast';

export default function SiteVisits() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const { orders } = useOrderStore();
  const { getCustomerById } = useCustomerStore();

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const handleStatusToggle = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newStatus = order.siteVisitStatus === 'completed' ? 'pending' : 'completed';
      await useOrderStore.getState().updateOrder(orderId, { siteVisitStatus: newStatus });

      setToastMessage(`Site visit marked as ${newStatus}`);
      setToastType('success');
      setShowToast(true);
    } catch (error: any) {
      console.error('Error updating site visit status:', error);
      setToastMessage(error.message || 'Failed to update status');
      setToastType('error');
      setShowToast(true);
    }
  };

  const weeklyVisits = useMemo(() => {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return weekDays.map(day => {
      const dayVisits = orders.filter(order => {
        if (order.deliveryMethod !== 'site_visit' || !order.siteVisitDate) return false;
        
        const visitDate = order.siteVisitDate.toDate?.() || new Date(order.siteVisitDate);
        
        // Check if the visit is on this day and matches the filter
        const isSameDay = 
          visitDate.getFullYear() === day.getFullYear() &&
          visitDate.getMonth() === day.getMonth() &&
          visitDate.getDate() === day.getDate();
        
        return isSameDay && (filter === 'all' || order.siteVisitStatus === filter);
      }).sort((a, b) => {
        const dateA = a.siteVisitDate.toDate?.() || new Date(a.siteVisitDate);
        const dateB = b.siteVisitDate.toDate?.() || new Date(b.siteVisitDate);
        return dateA.getTime() - dateB.getTime();
      });

      return {
        date: day,
        visits: dayVisits
      };
    });
  }, [orders, currentWeekStart, filter]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Site Visits</h1>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'pending' | 'completed')}
            className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"
          >
            <option value="all" className="text-gray-900 dark:text-gray-200">All Site Visits</option>
            <option value="pending" className="text-gray-900 dark:text-gray-200">Pending</option>
            <option value="completed" className="text-gray-900 dark:text-gray-200">Completed</option>
          </select>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-900 dark:text-gray-200" />
            </button>
            <div className="text-sm text-gray-900 dark:text-gray-200">
              {currentWeekStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
              {' - '}
              {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
                'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                }
              )}
            </div>
            <button
              onClick={handleNextWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-900 dark:text-gray-200" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weeklyVisits.map(({ date, visits }, index) => (
          <div key={date.toISOString()} className="space-y-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {days[index]}
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-200">
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-700">
              {visits.map(order => {
                const customer = getCustomerById(order.customerId);
                const siteVisitDate = order.siteVisitDate.toDate?.() || new Date(order.siteVisitDate);
                
                return (
                  <div
                    key={order.id}
                    className={`rounded-lg p-3 shadow-sm transition-colors duration-200 cursor-pointer relative
                      ${order.siteVisitStatus === 'completed'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          #{order.id.slice(-6)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusToggle(order.id);
                        }}
                        className={`absolute top-1 right-1 px-2 py-1 rounded-full text-xs font-medium ${
                          order.siteVisitStatus === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'
                        }`}
                      >
                        {order.siteVisitStatus || 'pending'}
                      </button>
                    </div>

                    {customer && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                        {customer.companyName && (
                          <div className="opacity-75 truncate">({customer.companyName})</div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-2 text-gray-400" />
                      <span>
                        {siteVisitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              {visits.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  No visits
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

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
