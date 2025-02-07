import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, Mail, MapPin, Building, Calendar, Clock, FileText, ArrowLeft, Edit } from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { useOrderStore } from '../store/orderStore';
import { useCommunicationStore } from '../store/communicationStore';
import { useAuthStore } from '../store/authStore';
import type { CommunicationType } from '../types';
import CommunicationLog from '../components/CommunicationLog';
import AddCommunicationModal from '../components/AddCommunicationModal';
import EditCustomerModal from '../components/modals/EditCustomerModal';
import Toast from '../components/ui/Toast';

export default function CustomerDetails() {
  const { id } = useParams();
  const { getCustomerById, updateCustomer, initialize: initializeCustomers } = useCustomerStore();
  const { orders, initialize: initializeOrders } = useOrderStore();
  const { addCommunication, initialize: initializeCommunications } = useCommunicationStore();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [loading, setLoading] = useState(true);

  const customer = getCustomerById(id!);
  const customerOrders = orders.filter(order => order.customerId === id);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        const [customersCleanup, ordersCleanup, communicationsCleanup] = await Promise.all([
          initializeCustomers(),
          initializeOrders(),
          initializeCommunications()
        ]);

        return () => {
          if (typeof customersCleanup === 'function') customersCleanup();
          if (typeof ordersCleanup === 'function') ordersCleanup();
          if (typeof communicationsCleanup === 'function') communicationsCleanup();
        };
      } catch (error) {
        console.error('Error initializing data:', error);
        return undefined;
      } finally {
        setLoading(false);
      }
    };

    const cleanup = initializeData();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [initializeCustomers, initializeOrders, initializeCommunications]);

  const handleAddCommunication = async ({ type, summary }: { type: CommunicationType; summary: string }) => {
    try {
      await addCommunication({
        customerId: id!,
        type,
        summary
      });
      setToastMessage('Communication added successfully');
      setToastType('success');
      setShowToast(true);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding communication:', error);
      setToastMessage('Failed to add communication');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    try {
      await updateCustomer(id!, customerData);
      setToastMessage('Customer updated successfully');
      setToastType('success');
      setShowToast(true);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      setToastMessage('Failed to update customer');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Customer not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The customer you're looking for doesn't exist.</p>
          <Link
            to="/customers"
            className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Customers
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {customer.firstName} {customer.lastName}
          </h1>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Customer
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.companyName || 'Individual'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.address}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer Since</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.updatedAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">{customer.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {customerOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {order.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                          order.status === 'paid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${order.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {customerOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Communications */}
        <div className="lg:col-span-1">
          <CommunicationLog
            customerId={id!}
            onAddClick={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      <AddCommunicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddCommunication}
      />

      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditCustomer}
        customer={customer}
      />

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