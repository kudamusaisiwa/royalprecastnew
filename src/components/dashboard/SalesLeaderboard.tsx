import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Calendar } from 'lucide-react';
import { useOrderStore } from '../../store/orderStore';
import { usePaymentStore } from '../../store/paymentStore';
import { useActivityStore } from '../../store/activityStore';
import { useUserStore } from '../../store/userStore';
import { useCustomerStore } from '../../store/customerStore'; // Add customer store
import { getDateRange } from '../../utils/dateRange';
import DateRangePicker from '../DateRangePicker';
import type { Order } from '../../types';

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Range' }
];

interface SalesStats {
  userId: string;
  userName: string;
  // Orders that received payments
  paidOrders: number;
  paidRevenue: number;
  // New orders created in period
  newOrders: number;
  newOrdersValue: number;
  // Total stats
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  weightedScore: number;
}

interface Props {
  // timeRange: string;
  // customStartDate?: Date | null;
  // customEndDate?: Date | null;
}

export default function SalesLeaderboard() {
  const { orders } = useOrderStore();
  const { payments } = usePaymentStore();
  const { activities } = useActivityStore();
  const { customers } = useCustomerStore(); // Add customers
  const { getUserById } = useUserStore();

  const [salesStats, setSalesStats] = useState<SalesStats[]>([]);
  const [timeRange, setTimeRange] = useState('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date()
  })

  useEffect(() => {
    const calculateDateRange = () => {
      const now = new Date()
      let start: Date
      let end: Date = new Date(now)
      end.setHours(23, 59, 59, 999)

      switch (timeRange) {
        case 'today':
          start = new Date(now)
          start.setHours(0, 0, 0, 0)
          break
        case '7d':
          start = new Date(now)
          start.setDate(now.getDate() - 7)
          start.setHours(0, 0, 0, 0)
          break
        case '30d':
          start = new Date(now)
          start.setDate(now.getDate() - 30)
          start.setHours(0, 0, 0, 0)
          break
        case 'custom':
          if (customStartDate && customEndDate) {
            start = customStartDate
            end = customEndDate
          } else {
            // Default to today if custom dates are not set
            start = new Date(now)
            start.setHours(0, 0, 0, 0)
          }
          break
        default:
          start = new Date(now)
          start.setHours(0, 0, 0, 0)
      }

      setDateRange({ from: start, to: end })
    }

    calculateDateRange()
  }, [timeRange, customStartDate, customEndDate])

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    if (range !== 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    if (startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      setTimeRange('custom');
    }
    setShowDatePicker(false);
  };

  const createInitialStats = (userId: string, userName: string): SalesStats => ({
    userId,
    userName,
    paidOrders: 0,
    paidRevenue: 0,
    newOrders: 0,
    newOrdersValue: 0,
    totalOrders: 0,
    totalRevenue: 0,
    conversionRate: 0,
    weightedScore: 0
  });

  useEffect(() => {
    // Helper function to get the creator of an order
    const getOrderCreator = (order: Order): string | undefined => {
      const creator = order.createdBy;
      if (!creator) {
        // Last resort: customer's creator
        return order.customerId ? customers.find(customer => customer.id === order.customerId)?.createdBy : undefined;
      }
      return creator;
    };

    // Process ALL orders to initialize stats
    const unattributedStats: SalesStats = {
      userId: 'unattributed',
      userName: 'Unattributed Sales',
      paidOrders: 0,
      paidRevenue: 0,
      newOrders: 0,
      newOrdersValue: 0,
      totalOrders: 0,
      totalRevenue: 0,
      conversionRate: 0,
      weightedScore: 0
    };

    const statsByUser: { [key: string]: SalesStats } = {};

    orders.forEach(order => {
      const userId = getOrderCreator(order);
      if (!userId) {
        unattributedStats.totalOrders++;
        unattributedStats.totalRevenue += (order.totalAmount || 0);
        return;
      }

      if (!statsByUser[userId]) {
        statsByUser[userId] = createInitialStats(
          userId,
          getUserById(userId)?.name || `User ${userId.slice(0, 8)}`
        );
      }

      const stats = statsByUser[userId];

      // Add to total orders/revenue
      stats.totalOrders++;
      stats.totalRevenue += (order.totalAmount || 0);

      // If order was created in this period, add to new orders
      if (order.createdAt >= dateRange.from && order.createdAt <= dateRange.to) {
        stats.newOrders++;
        stats.newOrdersValue += (order.totalAmount || 0);
      }
    });

    // Process ALL payments first, grouped by order
    const orderPayments = new Map<string, {
      totalAmount: number;
      payments: Array<{
        id: string;
        amount: number;
        date: Date;
      }>;
    }>();

    // First collect all payments
    payments.forEach(payment => {
      const order = orders.find(order => order.id === payment.orderId);
      if (!order) {
        console.warn('Payment references missing order:', {
          paymentId: payment.id,
          orderId: payment.orderId,
          amount: payment.amount
        });
        return;
      }

      const userId = getOrderCreator(order);
      if (!userId) {
        unattributedStats.paidRevenue += payment.amount;
        return;
      }

      if (!statsByUser[userId]) {
        statsByUser[userId] = createInitialStats(
          userId,
          getUserById(userId)?.name || `User ${userId.slice(0, 8)}`
        );
      }

      const stats = statsByUser[userId];

      const current = orderPayments.get(payment.orderId) || {
        totalAmount: 0,
        payments: []
      };

      current.totalAmount += payment.amount;
      current.payments.push({
        id: payment.id,
        amount: payment.amount,
        date: payment.date
      });

      orderPayments.set(payment.orderId, current);

      // Add any payments received in this period
      const periodPayments = current.payments.filter(
        payment => payment.date >= dateRange.from && payment.date <= dateRange.to
      );

      if (periodPayments.length > 0) {
        stats.paidOrders++;
        stats.paidRevenue += periodPayments.reduce((sum, p) => sum + p.amount, 0);
      }
    });

    // Calculate conversion rates and weighted scores, then sort
    const stats = Object.values(statsByUser)
      .map(stat => {
        // Calculate conversion rate (paid orders to new orders)
        const conversionRate = stat.newOrders > 0 
          ? (stat.paidOrders / stat.newOrders) * 100 
          : 0;

        // Calculate weighted score:
        // - 60% weight on actual revenue (payments received)
        // - 10% weight on new orders (sales activity)
        // - 30% weight on conversion rate (payment effectiveness)
        const weightedScore = 
          (stat.paidRevenue * 0.6) +       // 60% weight on revenue
          (stat.newOrdersValue * 0.1) +     // 10% weight on new orders
          (conversionRate * 0.3);          // 30% weight on conversion

        return {
          ...stat,
          conversionRate,
          weightedScore
        };
      })
      .sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));

    // Calculate conversion ratio for unattributed sales
    unattributedStats.conversionRate = unattributedStats.newOrders > 0 
      ? (unattributedStats.paidOrders / unattributedStats.newOrders) * 100 
      : 0;

    // Calculate weighted score for unattributed sales using same weights
    unattributedStats.weightedScore = 
      (unattributedStats.paidRevenue * 0.6) +       // 60% revenue
      (unattributedStats.newOrdersValue * 0.1) +     // 10% new orders
      (unattributedStats.conversionRate * 0.3);     // 30% conversion

    // Add unattributed stats at the bottom regardless of score
    const sortedStats = [...stats, unattributedStats];

    setSalesStats(sortedStats);
  }, [orders, payments, activities, customers, dateRange, getUserById]);

  if (!salesStats.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sales Leaderboard
            </h2>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          No sales data available for this period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Sales Leaderboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="block w-40 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {showDatePicker && (
        <DateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          onApply={handleDateRangeChange}
          onCancel={() => {
            setShowDatePicker(false);
            if (!customStartDate || !customEndDate) {
              setTimeRange('today');
            }
          }}
        />
      )}

      <div className="space-y-4">
        {salesStats.map((stat, index) => (
          <div
            key={stat.userId}
            className={`p-4 rounded-lg ${
              index % 2 === 0 ? 'bg-yellow-50 dark:bg-gray-700/50' : 'bg-gray-50 dark:bg-gray-700/30'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {index === 0 ? (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                ) : index === 1 ? (
                  <Medal className="w-5 h-5 text-gray-500" />
                ) : index === 2 ? (
                  <Medal className="w-5 h-5 text-bronze-500" />
                ) : null}
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {stat.userName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Score: {stat.weightedScore.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${stat.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} collected
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${stat.newOrdersValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} new orders
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <div>
                {stat.paidOrders} paid orders / {stat.newOrders} new orders
              </div>
              <div>
                {stat.conversionRate.toFixed(1)}% conversion
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
