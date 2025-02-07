import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import { usePaymentStore } from '../store/paymentStore';
import { useCustomerStore } from '../store/customerStore';
import { CreditCard, Search, User, ShoppingCart } from 'lucide-react';
import type { Order, PaymentMethod, OperationalStatus } from '../types';
import PaymentMethodModal from '../components/modals/PaymentMethodModal';
import Pagination from '../components/ui/Pagination';
import Toast from '../components/ui/Toast';
import { useToast } from "@/components/ui/use-toast";
import { formatPrice } from '@/lib/utils';
import { Badge } from "../components/ui/Badge";

const getStatusBadgeVariant = (status: OperationalStatus) => {
  switch (status) {
    case 'quotation':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    case 'production':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'quality_control':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'dispatch':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'installation':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export default function PaymentManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hideQuotations, setHideQuotations] = useState(true);
  const itemsPerPage = 10;

  const { orders } = useOrderStore();
  const { addPayment, getTotalPaidForOrder } = usePaymentStore();
  const { getCustomerById } = useCustomerStore();

  const unpaidInvoices = orders.filter(order => {
    const totalPaid = getTotalPaidForOrder(order.id);
    const balance = order.totalAmount - totalPaid;
    
    // Always show orders with pending balance
    if (balance > 0) {
      // If hiding quotations, only show if not in quotation stage
      return !hideQuotations || order.status !== 'quotation';
    }
    
    return false;
  });

  const filteredInvoices = unpaidInvoices.filter(order => {
    const customer = getCustomerById(order.customerId);
    const searchStr = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(searchStr) ||
      (customer && `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchStr))
    );
  });

  const handleNavigateToOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleNavigateToCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddPayment = async (method: PaymentMethod, amount: number, notes?: string, reference?: string) => {
    if (!selectedInvoice) return;

    try {
      await addPayment({
        orderId: selectedInvoice.id,
        amount,
        method,
        notes,
        reference
      });

      toast({
        title: "Success",
        description: "Payment recorded and follow-up task completed",
      });

      setShowPaymentModal(false);
      setSelectedInvoice(null);
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payment Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm" htmlFor="hideQuotations">Hide Quotations</label>
            <input
              id="hideQuotations"
              type="checkbox"
              checked={hideQuotations}
              onChange={(e) => setHideQuotations(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-64 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedInvoices.map((invoice) => {
                const customer = getCustomerById(invoice.customerId);
                const totalPaid = getTotalPaidForOrder(invoice.id);
                const balance = invoice.totalAmount - totalPaid;

                return (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleNavigateToOrder(invoice.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        #{invoice.id}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {customer && (
                        <button
                          onClick={() => handleNavigateToCustomer(customer.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          <User className="h-4 w-4" />
                          {customer.firstName} {customer.lastName}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge className={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatPrice(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                      {formatPrice(totalPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                      {formatPrice(balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setShowPaymentModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No unpaid invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredInvoices.length}
          onPageChange={handlePageChange}
        />
      </div>

      {selectedInvoice && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
          onConfirm={handleAddPayment}
          totalAmount={selectedInvoice.totalAmount}
          paidAmount={getTotalPaidForOrder(selectedInvoice.id)}
        />
      )}
    </div>
  );
}