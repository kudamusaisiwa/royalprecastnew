import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import OrderStatusBadge from '../components/orders/OrderStatusBadge';
import QuickStatusChange from '../components/orders/QuickStatusChange';
import InvoicePDF from '../components/pdf/InvoicePDF';
import Pagination from '../components/ui/Pagination';
import type { OrderStatus } from '../types';

export default function AllOrders() {
  const { 
    orders,
    currentPage,
    itemsPerPage,
    searchTerm,
    selectedStatus,
    hideQuotations,
    setCurrentPage,
    setItemsPerPage,
    setSearchTerm,
    setSelectedStatus,
    setHideQuotations
  } = useOrderStore();
  const { getCustomerById } = useCustomerStore();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ 
    key: 'createdAt', 
    direction: 'desc' 
  });

  // Filter and sort orders
  const filteredOrders = React.useMemo(() => {
    // First filter the orders
    const filtered = orders.filter(order => {
      const customer = getCustomerById(order.customerId);
      const customerName = customer ? `${customer.firstName} ${customer.lastName}` : '';
      
      const matchesSearch = searchTerm === '' || 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

      // Hide quotations if the filter is enabled
      if (hideQuotations && order.status === 'quotation') {
        return false;
      }

      return matchesSearch && matchesStatus;
    });

    // Then sort the filtered results
    return [...filtered].sort((a, b) => {
      if (sortConfig.key === 'createdAt') {
        const dateA = a[sortConfig.key].getTime();
        const dateB = b[sortConfig.key].getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [orders, searchTerm, selectedStatus, hideQuotations, sortConfig, getCustomerById]);

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Calculate pagination
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = itemsPerPage === -1 
    ? filteredOrders 
    : filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">All Orders</h1>
        <Link
          to="/orders"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="search-input dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as OrderStatus | 'all');
                setCurrentPage(1); // Reset to first page on status change
              }}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 px-3 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="quotation">Quotation</option>
              <option value="paid">Paid</option>
              <option value="production">Production</option>
              <option value="quality_control">Quality Control</option>
              <option value="dispatch">Dispatch</option>
              <option value="installation">Installation</option>
              <option value="completed">Completed</option>
            </select>
            <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={hideQuotations}
                onChange={(e) => setHideQuotations(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span>Hide quotations</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer Ref
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Amount
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('createdAt')}
                >
                  Created At {sortConfig.key === 'createdAt' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedOrders.map((order) => {
                const customer = getCustomerById(order.customerId);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-mono"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer && (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.firstName} {customer.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.customerReferenceNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <QuickStatusChange
                        orderId={order.id}
                        currentStatus={order.status}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          View Details
                        </Link>
                        <PDFDownloadLink
                          document={
                            <InvoicePDF 
                              order={{
                                ...order,
                                customerName: customer ? `${customer.firstName} ${customer.lastName}` : '',
                                customerEmail: customer?.email,
                                customerPhone: customer?.phone,
                                customerAddress: customer?.address,
                                customerCompany: customer?.companyName
                              }}
                            />
                          }
                          fileName={`order-${order.id}.pdf`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          {({ loading }) => (
                            loading ? 
                              <span>Loading...</span> : 
                              <Download className="h-5 w-5" />
                          )}
                        </PDFDownloadLink>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredOrders.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
}