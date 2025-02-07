import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, ChevronLeft, ChevronRight, Archive, AlertTriangle } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import Toast from '../components/ui/Toast';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Delivery History Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6 text-center">
          <div className="bg-red-50 p-6 rounded-lg">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600">
              Unable to load delivery history. Please try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DeliveryHistory() {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [currentMonthStart, setCurrentMonthStart] = useState(() => {
    const today = new Date();
    today.setDate(1);
    return today;
  });

  const { orders } = useOrderStore();
  const { getCustomerById } = useCustomerStore();

  const handlePreviousMonth = useCallback(() => {
    const newDate = new Date(currentMonthStart);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonthStart(newDate);
  }, [currentMonthStart]);

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(currentMonthStart);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonthStart(newDate);
  }, [currentMonthStart]);

  const historicalDeliveries = useMemo(() => {
    // Get the first and last day of the current month
    const firstDay = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), 1);
    const lastDay = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 0);

    // Filter orders for completed deliveries in the current month
    return orders
      .filter(order => {
        if (!order || order.deliveryMethod !== 'delivery' || !order.deliveryDate) return false;
        
        let deliveryDate;
        try {
          // Handle different date formats
          if (order.deliveryDate instanceof Date) {
            deliveryDate = order.deliveryDate;
          } else if (typeof order.deliveryDate.toDate === 'function') {
            deliveryDate = order.deliveryDate.toDate();
          } else {
            deliveryDate = new Date(order.deliveryDate);
          }

          // Check if delivery is within the current month and is completed
          return (
            deliveryDate >= firstDay &&
            deliveryDate <= lastDay &&
            order.deliveryStatus === 'completed'
          );
        } catch (error) {
          console.error('Error processing delivery date:', error);
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = a.deliveryDate.toDate?.() || new Date(a.deliveryDate);
        const dateB = b.deliveryDate.toDate?.() || new Date(b.deliveryDate);
        return dateB.getTime() - dateA.getTime(); // Sort by most recent first
      });
  }, [orders, currentMonthStart]);

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Archive className="mr-3 h-6 w-6 text-gray-500" />
            Delivery History
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">
              {currentMonthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {historicalDeliveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No completed deliveries for this month
          </div>
        ) : (
          <div className="space-y-6">
            {historicalDeliveries.map((delivery, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                    {delivery.deliveryDate.toLocaleDateString()}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    1 delivery
                  </span>
                </div>
                <div className="p-4 space-y-3">
                  <div
                    className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 shadow-sm transition-colors duration-200 cursor-pointer"
                    onClick={() => navigate(`/orders/${delivery.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{delivery.id.slice(-6)}
                        </span>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        Completed
                      </div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <div className="font-medium">{delivery.customerName}</div>
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-2 text-gray-400" />
                      <span>
                        {delivery.deliveryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showToast && (
          <Toast 
            message={toastMessage} 
            type={toastType} 
            onClose={() => setShowToast(false)} 
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
