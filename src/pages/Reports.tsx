import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import { useProductStore } from '../store/productStore';
import { usePaymentStore } from '../store/paymentStore'; 
import DateRangePicker from '../components/DateRangePicker';
import { getDateRange } from '../utils/dateRange';
import { startOfDay, endOfDay } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Range' }
];

export default function Reports() {
  const [timeRange, setTimeRange] = useState('7d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  
  const { orders, getOrderStats, getOrderTrends } = useOrderStore();
  const { customers } = useCustomerStore();
  const { products } = useProductStore();
  const { payments, initialize: initPayments, getTotalPaidForOrder } = usePaymentStore();

  useEffect(() => {
    const cleanup = initPayments();
    return () => {
      cleanup.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [initPayments]);

  // Calculate payment summary
  const paymentSummary = useMemo(() => {
    const { startDate, endDate } = getDateRange(timeRange, customStartDate, customEndDate);
    
    const summary = {
      bank_transfer: { count: 0, total: 0 },
      cash: { count: 0, total: 0 },
      ecocash: { count: 0, total: 0 },
      innbucks: { count: 0, total: 0 }
    };

    // Filter payments by date range and status
    const filteredPayments = payments.filter(payment => {
      if (!payment.status || payment.status !== 'completed' || !payment.date) return false;

      // Get the start and end of the payment date
      const paymentStartOfDay = startOfDay(payment.date);
      const paymentEndOfDay = endOfDay(payment.date);

      // For today/yesterday, check if payment falls within the exact day
      if (timeRange === 'today' || timeRange === 'yesterday') {
        return paymentStartOfDay.getTime() === startOfDay(startDate).getTime();
      }

      // For other ranges, check if payment falls within the range
      return paymentStartOfDay >= startDate && paymentEndOfDay <= endDate;
    });

    // Calculate totals for each payment method
    filteredPayments.forEach(payment => {
      if (payment.method && typeof payment.amount === 'number') {
        summary[payment.method].count++;
        summary[payment.method].total = Number(
          (summary[payment.method].total + payment.amount).toFixed(2)
        );
      }
    });

    return summary;
  }, [payments, timeRange, customStartDate, customEndDate]);

  // Calculate top customers
  const topCustomers = useMemo(() => {
    const customerStats = new Map();

    orders.forEach(order => {
      if (order.status !== 'quotation') {
        const customerId = order.customerId;
        const stats = customerStats.get(customerId) || {
          totalOrders: 0,
          totalRevenue: 0,
          lastOrderDate: null
        };

        stats.totalOrders++;
        stats.totalRevenue += order.totalAmount;
        if (!stats.lastOrderDate || order.createdAt > stats.lastOrderDate) {
          stats.lastOrderDate = order.createdAt;
        }

        customerStats.set(customerId, stats);
      }
    });

    return Array.from(customerStats.entries())
      .map(([customerId, stats]) => ({
        customer: customers.find(c => c.id === customerId),
        ...stats
      }))
      .filter(item => item.customer)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [orders, customers]);

  // Calculate top products
  const topProducts = useMemo(() => {
    const productStats = new Map();

    orders.forEach(order => {
      if (order.status !== 'quotation') {
        order.products.forEach(product => {
          const stats = productStats.get(product.id) || {
            name: product.name,
            totalQuantity: 0,
            totalRevenue: 0,
            averagePrice: 0,
            orderCount: 0
          };

          stats.totalQuantity += product.quantity;
          stats.totalRevenue += product.quantity * product.unitPrice;
          stats.orderCount++;
          stats.averagePrice = stats.totalRevenue / stats.totalQuantity;

          productStats.set(product.id, stats);
        });
      }
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [orders]);

  const stats = getOrderStats(timeRange, customStartDate, customEndDate);
  const trends = getOrderTrends(timeRange, customStartDate, customEndDate);

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
    setTimeRange('custom');
    setShowDatePicker(false);
  };

  const handleTimeRangeChange = (value: string) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setTimeRange(value);
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  };

  return (
    <div className="space-y-6">
      {showDatePicker && (
        <DateRangePicker
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
          onSelect={handleDateRangeSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports</h1>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="modern-select py-2 pl-3 pr-10 text-base"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trends Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Trends</h2>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name"
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: '#F3F4F6'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3B82F6"
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(paymentSummary).map(([method, data]) => (
              <div key={method} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {method.replace('_', ' ')}
                </h3>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.count}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ${data.total.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Customers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 10 Customers</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Orders
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topCustomers.map((item, index) => (
                  <tr key={item.customer.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.customer.firstName} {item.customer.lastName}
                      </div>
                      {item.customer.companyName && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.customer.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${item.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.lastOrderDate.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top 10 Products</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Avg. Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topProducts.map((product, index) => (
                  <tr key={product.name} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {product.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${product.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${product.averagePrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
}