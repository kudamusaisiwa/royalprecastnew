import React, { useState, useEffect } from 'react';
import { useCustomerStore } from '../store/customerStore';
import { usePermissions } from '../hooks/usePermissions';
import CustomerListHeader from '../components/customers/CustomerListHeader';
import CustomerSearch from '../components/customers/CustomerSearch';
import CustomerTable from '../components/customers/CustomerTable';
import AddCustomerModal from '../components/modals/AddCustomerModal';
import EditCustomerModal from '../components/modals/EditCustomerModal';
import DeleteCustomerModal from '../components/modals/DeleteCustomerModal';
import ImportCustomersModal from '../components/modals/ImportCustomersModal';
import Pagination from '../components/ui/Pagination';
import Toast from '../components/ui/Toast';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { customers, addCustomer, updateCustomer, deleteCustomer, initialize, loading } = useCustomerStore();
  const { canManageCustomers } = usePermissions();

  // Initialize customers when component mounts
  useEffect(() => {
    const initializeCustomers = async () => {
      try {
        const cleanup = await initialize();
        return () => {
          if (typeof cleanup === 'function') {
            cleanup();
          }
        };
      } catch (error) {
        console.error('Error initializing customers:', error);
        return undefined;
      }
    };

    const cleanupPromise = initializeCustomers();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [initialize]);

  const filteredCustomers = customers.filter(customer => {
    const searchStr = searchTerm.toLowerCase();
    return (
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchStr) ||
      (customer.companyName && customer.companyName.toLowerCase().includes(searchStr)) ||
      customer.email.toLowerCase().includes(searchStr) ||
      customer.phone.includes(searchStr)
    );
  });

  // Calculate pagination
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = itemsPerPage === -1 
    ? filteredCustomers 
    : filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'totalOrders' | 'totalRevenue'>) => {
    try {
      await addCustomer(customerData);
      setToastMessage('Customer added successfully');
      setToastType('success');
      setShowToast(true);
      setShowAddModal(false);
    } catch (error) {
      setToastMessage('Failed to add customer');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleEditCustomer = async (customerData: Partial<Customer>) => {
    if (!selectedCustomer) return;
    try {
      await updateCustomer(selectedCustomer, customerData);
      setToastMessage('Customer updated successfully');
      setToastType('success');
      setShowToast(true);
      setShowEditModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      setToastMessage('Failed to update customer');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      await deleteCustomer(selectedCustomer);
      setToastMessage('Customer deleted successfully');
      setToastType('success');
      setShowToast(true);
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      setToastMessage('Failed to delete customer');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerListHeader
        onAddClick={() => setShowAddModal(true)}
        onImportClick={() => setShowImportModal(true)}
        onExportClick={() => {}}
        canManageCustomers={canManageCustomers}
      />

      <CustomerSearch
        value={searchTerm}
        onChange={setSearchTerm}
      />

      <CustomerTable
        customers={paginatedCustomers}
        canManageCustomers={canManageCustomers}
        onEditClick={(id) => {
          setSelectedCustomer(id);
          setShowEditModal(true);
        }}
        onDeleteClick={(id) => {
          setSelectedCustomer(id);
          setShowDeleteModal(true);
        }}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredCustomers.length}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCustomer}
      />

      {selectedCustomer && (
        <>
          <EditCustomerModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
            }}
            onSave={handleEditCustomer}
            customer={customers.find(c => c.id === selectedCustomer)!}
          />

          <DeleteCustomerModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setSelectedCustomer(null);
            }}
            onConfirm={handleDeleteCustomer}
            customerName={`${customers.find(c => c.id === selectedCustomer)?.firstName} ${
              customers.find(c => c.id === selectedCustomer)?.lastName
            }`}
          />
        </>
      )}

      <ImportCustomersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
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