import React, { useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { Download, Eye, X } from 'lucide-react';
import InvoicePDF from '../pdf/InvoicePDF';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentHistory from './PaymentHistory';
import OrderNotes from './OrderNotes'; // Added import statement
import { usePermissions } from '../../hooks/usePermissions';
import { usePaymentStore } from '../../store/paymentStore';
import type { Order, OrderStatus, PaymentMethod } from '../../types';

interface InvoiceViewProps {
  order: Order & {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerCompany?: string;
  };
  onStatusChange?: (status: OrderStatus, paymentMethod?: PaymentMethod, paymentAmount?: number, paymentNotes?: string) => void;
  showStatusChange?: boolean;
}

export default function InvoiceView({ 
  order, 
  onStatusChange, 
  showStatusChange = false 
}: InvoiceViewProps) {
  const { canManagePayments } = usePermissions();
  const { getTotalPaidForOrder } = usePaymentStore();
  const [showPreview, setShowPreview] = useState(false);

  const totalPaid = getTotalPaidForOrder(order.id);
  const paymentStatus = totalPaid === 0 ? 'pending' : 
                       totalPaid >= order.totalAmount ? 'paid' : 'partial';

  const PreviewModal = () => {
    if (!showPreview) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <div className="pointer-events-auto w-screen max-w-4xl">
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                  <div className="flex items-center justify-between px-4 py-6 sm:px-6">
                    <h2 className="text-lg font-medium">Invoice Preview</h2>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="rounded-md text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="flex-1 px-4 sm:px-6">
                    <PDFViewer style={{ width: '100%', height: '100%' }}>
                      <InvoicePDF order={order} />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <OrderStatusBadge status={order.status} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Created on {order.createdAt.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Invoice
            </button>
            <PDFDownloadLink
              document={<InvoicePDF order={order} />}
              fileName={`order-${order.id}.pdf`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Generating PDF...' : 'Download Invoice'}
                </>
              )}
            </PDFDownloadLink>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.customerName}</p>
              </div>
              {order.customerCompany && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.customerCompany}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.customerPhone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                <p className="text-sm text-gray-900 dark:text-white">{order.customerAddress}</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {order.products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${product.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        ${(product.quantity * product.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <dl className="space-y-2">
                <div className="flex justify-end text-sm">
                  <dt className="font-medium text-gray-500 dark:text-gray-400 w-32">Subtotal:</dt>
                  <dd className="text-gray-900 dark:text-white">${((order.totalAmount || 0) / 1.15).toFixed(2)}</dd>
                </div>
                <div className="flex justify-end text-sm">
                  <dt className="font-medium text-gray-500 dark:text-gray-400 w-32">VAT (15%):</dt>
                  <dd className="text-gray-900 dark:text-white">${(order.vatAmount || 0).toFixed(2)}</dd>
                </div>
                <div className="flex justify-end text-sm font-medium">
                  <dt className="text-gray-900 dark:text-white w-32">Total:</dt>
                  <dd className="text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</dd>
                </div>
                <div className="flex justify-end text-sm">
                  <dt className="font-medium text-gray-500 dark:text-gray-400 w-32">Amount Paid:</dt>
                  <dd className="text-green-600 dark:text-green-400">${totalPaid.toFixed(2)}</dd>
                </div>
                <div className="flex justify-end text-sm font-medium">
                  <dt className="text-gray-900 dark:text-white w-32">Balance Due:</dt>
                  <dd className="text-red-600 dark:text-red-400">
                    ${(order.totalAmount - totalPaid).toFixed(2)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {canManagePayments && (
          <div className="lg:col-span-1 space-y-6">
            <PaymentHistory
              orderId={order.id}
              totalAmount={order.totalAmount}
            />
            <OrderNotes order={order} />
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
}