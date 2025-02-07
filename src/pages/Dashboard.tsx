import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertCircle
} from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useCustomerStore } from '../store/customerStore';
import { useProductStore } from '../store/productStore';
import { useActivityStore } from '../store/activityStore';
import { useTaskStore } from '../store/taskStore';
import StatCard from '../components/dashboard/StatCard';
import SalesLeaderboard from '../components/dashboard/SalesLeaderboard';
import DateRangePicker from '../components/DateRangePicker';
import LegacyToast from '../components/ui/LegacyToast';
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { LinkedItemsOverview } from "@/components/dashboard/LinkedItemsOverview";

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Range' }
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { orders, getOrderStats, getOrderTrends, initialize: initOrders } = useOrderStore();
  const { initialize: initCustomers } = useCustomerStore();
  const { initialize: initProducts } = useProductStore();
  const { initialize: initActivities } = useActivityStore();
  const { initialize: initTasks } = useTaskStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Initialize all data listeners
        const cleanupFunctions = await Promise.all([
          initOrders(),
          initCustomers(),
          initProducts(),
          initActivities(),
          initTasks()
        ]);

        // Filter out undefined cleanup functions
        const validCleanupFunctions = cleanupFunctions.filter((fn): fn is () => void => fn !== undefined);

        setIsLoading(false);

        // Return cleanup function that calls all cleanup functions
        return () => {
          validCleanupFunctions.forEach(cleanup => cleanup());
        };
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    const cleanup = loadData();
    return () => {
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, [initOrders, initCustomers, initProducts, initActivities, initTasks]);

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

  const stats = getOrderStats(timeRange, customStartDate, customEndDate);
  const trends = getOrderTrends(timeRange, customStartDate, customEndDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <LegacyToast 
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <TasksOverview />
      <LinkedItemsOverview />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 px-3 text-sm"
          >
            {timeRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          {timeRange === 'custom' && (
            <button
              onClick={() => setShowDatePicker(true)}
              className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Select Dates
            </button>
          )}
        </div>
      </div>

      {showDatePicker && (
        <DateRangePicker
          startDate={customStartDate}
          endDate={customEndDate}
          onApply={handleDateRangeChange}
          onCancel={() => setShowDatePicker(false)}
        />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          change={Math.round(stats.orderChange).toString()}
          trend={stats.orderChange >= 0 ? 'up' : 'down'}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Active Customers"
          value={stats.activeCustomers.toString()}
          change={Math.round(stats.customerChange).toString()}
          trend={stats.customerChange >= 0 ? 'up' : 'down'}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toLocaleString()}`}
          change={Math.round(stats.revenueChange).toString()}
          trend={stats.revenueChange >= 0 ? 'up' : 'down'}
          icon={TrendingUp}
          color="yellow"
        />
        <StatCard
          title="Pending Revenue"
          value={`$${stats.pendingRevenue.toLocaleString()}`}
          change={Math.round(stats.pendingChange).toString()}
          trend={stats.pendingChange >= 0 ? 'up' : 'down'}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Revenue Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Trends</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => `$${Number(value).toLocaleString()}`}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#10B981" />
              <Bar dataKey="outstanding" name="Outstanding" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Leaderboard */}
      <div className="w-full">
        <SalesLeaderboard />
      </div>
    </div>
  );
}