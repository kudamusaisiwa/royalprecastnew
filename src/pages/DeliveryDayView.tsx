import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Truck, Package, CheckCircle, Clock, XCircle, Download, MapPin } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import { useDeliveryStore } from '../store/deliveryStore';
import { exportDeliveryData } from '../utils/exportDeliveries';
import Toast from '../components/ui/Toast';

export default function DeliveryDayView() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [deliveryStatuses, setDeliveryStatuses] = useState<Record<string, 'pending' | 'completed' | 'cancelled'>>({});
  const [collectionStatuses, setCollectionStatuses] = useState<Record<string, 'pending' | 'completed' | 'cancelled'>>({});
  const [siteVisitStatuses, setSiteVisitStatuses] = useState<Record<string, 'pending' | 'completed' | 'cancelled'>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { orders } = useOrderStore();
  const { getCustomerById } = useCustomerStore();
  const { updateDeliveryStatus } = useDeliveryStore();

  if (!date) {
    return <Navigate to="/deliveries" />;
  }

  const currentDate = new Date(date);
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
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

  const siteVisits = orders.filter(order => {
    if (!order.siteVisitDate) return false;
    const siteVisitDate = new Date(order.siteVisitDate);
    return order.deliveryMethod === 'site_visit' && 
           siteVisitDate >= startOfDay && 
           siteVisitDate <= endOfDay;
  });

  const handleStatusToggle = async (orderId: string, type: 'delivery' | 'collection' | 'site_visit') => {
    // Get current status before updating
    const currentStatus = type === 'delivery' 
      ? deliveryStatuses[orderId] 
      : type === 'collection'
      ? collectionStatuses[orderId]
      : siteVisitStatuses[orderId];
    
    // Calculate new status
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    try {
      // Update local state first for immediate feedback
      if (type === 'delivery') {
        setDeliveryStatuses(prev => ({ ...prev, [orderId]: newStatus }));
      } else if (type === 'collection') {
        setCollectionStatuses(prev => ({ ...prev, [orderId]: newStatus }));
      } else {
        setSiteVisitStatuses(prev => ({ ...prev, [orderId]: newStatus }));
      }

      // Update in database
      await updateDeliveryStatus(orderId, type, newStatus);

      setToastMessage(`${type === 'delivery' ? 'Delivery' : type === 'collection' ? 'Collection' : 'Site Visit'} marked as ${newStatus}`);
      setToastType('success');
    } catch (error: any) {
      console.error('Error updating status:', error);
      // Revert local state on error
      if (type === 'delivery') {
        setDeliveryStatuses(prev => ({ ...prev, [orderId]: currentStatus }));
      } else if (type === 'collection') {
        setCollectionStatuses(prev => ({ ...prev, [orderId]: currentStatus }));
      } else {
        setSiteVisitStatuses(prev => ({ ...prev, [orderId]: currentStatus }));
      }
      setToastMessage(error.message || 'Failed to update status');
      setToastType('error');
    }
    setShowToast(true);
  };

  const handleExportData = () => {
    exportDeliveryData(
      { deliveries, collections, siteVisits },
      currentDate,
      currentDate,
      getCustomerById
    );
    
    setToastMessage('Delivery data exported successfully');
    setToastType('success');
    setShowToast(true);
  };

  const getStatusIcon = (status: 'pending' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusStyles = (status: 'pending' | 'completed' | 'cancelled', type: 'delivery' | 'collection' | 'site_visit') => {
    const baseStyles = type === 'delivery' 
      ? 'bg-blue-200 text-blue-700 hover:bg-blue-300 dark:bg-blue-900/50 dark:text-blue-300'
      : type === 'collection'
      ? 'bg-purple-200 text-purple-700 hover:bg-purple-300 dark:bg-purple-900/50 dark:text-purple-300'
      : 'bg-orange-200 text-orange-700 hover:bg-orange-300 dark:bg-orange-900/50 dark:text-orange-300';

    switch (status) {
      case 'completed':
        return 'bg-green-200 text-green-700 hover:bg-green-300 dark:bg-green-900/50 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-200 text-red-700 hover:bg-red-300 dark:bg-red-900/50 dark:text-red-300';
      default:
        return baseStyles;
    }
  };

  const getCardStyles = (status: 'pending' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30';
      case 'cancelled':
        return 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 opacity-75';
      default:
        return 'bg-white hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/deliveries"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Calendar
        </Link>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deliveries */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-500" />
            <h4 className="font-medium text-gray-900 dark:text-white">Deliveries ({deliveries.length})</h4>
          </div>

          <div className="space-y-2">
            {deliveries.map(order => {
              const customer = getCustomerById(order.customerId);
              const status = deliveryStatuses[order.id] || 'pending';
              return (
                <div
                  key={order.id}
                  className={`rounded-lg p-3 shadow-sm transition-colors duration-200 ${getCardStyles(status)}`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`flex-1 cursor-pointer ${status === 'cancelled' ? 'line-through' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">#{order.id}</div>
                      {customer && (
                        <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                          {customer.firstName} {customer.lastName}
                          {customer.companyName && (
                            <span className="block text-xs text-gray-600 dark:text-gray-400">
                              {customer.companyName}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                        {order.products.reduce((sum, p) => sum + p.quantity, 0)} items •{' '}
                        ${order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusToggle(order.id, 'delivery')}
                      className={`ml-2 p-2 rounded-full ${getStatusStyles(status, 'delivery')}`}
                    >
                      {getStatusIcon(status)}
                    </button>
                  </div>
                </div>
              );
            })}
            {deliveries.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No deliveries scheduled
              </p>
            )}
          </div>
        </div>

        {/* Collections */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-purple-500" />
            <h4 className="font-medium text-gray-900 dark:text-white">Collections ({collections.length})</h4>
          </div>

          <div className="space-y-2">
            {collections.map(order => {
              const customer = getCustomerById(order.customerId);
              const status = collectionStatuses[order.id] || 'pending';
              return (
                <div
                  key={order.id}
                  className={`rounded-lg p-3 shadow-sm transition-colors duration-200 ${getCardStyles(status)}`}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`flex-1 cursor-pointer ${status === 'cancelled' ? 'line-through' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">#{order.id}</div>
                      {customer && (
                        <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                          {customer.firstName} {customer.lastName}
                          {customer.companyName && (
                            <span className="block text-xs text-gray-600 dark:text-gray-400">
                              {customer.companyName}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                        {order.products.reduce((sum, p) => sum + p.quantity, 0)} items •{' '}
                        ${order.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleStatusToggle(order.id, 'collection')}
                      className={`ml-2 p-2 rounded-full ${getStatusStyles(status, 'collection')}`}
                    >
                      {getStatusIcon(status)}
                    </button>
                  </div>
                </div>
              );
            })}
            {collections.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No collections scheduled
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Site Visits Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          <h4 className="font-medium text-gray-900 dark:text-white">Site Visits ({siteVisits.length})</h4>
        </div>

        <div className="space-y-2">
          {siteVisits.map(order => {
            const customer = getCustomerById(order.customerId);
            const status = siteVisitStatuses[order.id] || 'pending';
            return (
              <div
                key={order.id}
                className={`rounded-lg p-3 shadow-sm transition-colors duration-200 ${getCardStyles(status)}`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className={`flex-1 cursor-pointer ${status === 'cancelled' ? 'line-through' : ''}`}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">#{order.id}</div>
                    {customer && (
                      <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                        {customer.firstName} {customer.lastName}
                        {customer.companyName && (
                          <span className="block text-xs text-gray-600 dark:text-gray-400">
                            {customer.companyName}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                      Site Visit • ${order.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStatusToggle(order.id, 'site_visit')}
                    className={`ml-2 p-2 rounded-full ${getStatusStyles(status, 'site_visit')}`}
                  >
                    {getStatusIcon(status)}
                  </button>
                </div>
              </div>
            );
          })}
          {siteVisits.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No site visits scheduled
            </p>
          )}
        </div>
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