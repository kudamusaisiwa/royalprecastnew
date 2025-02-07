import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { useActivityStore } from '../store/activityStore';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import ActivityIcon from '../components/activities/ActivityIcon';
import DateRangePicker from '../components/DateRangePicker';
import Toast from '../components/ui/Toast';
import type { ActivityType } from '../types';

const activityTypes = [
  { value: 'status_change', label: 'Status Changes' },
  { value: 'payment', label: 'Payments' },
  { value: 'customer_created', label: 'Customer Created' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'customer_updated', label: 'Customer Updated' },
  { value: 'order_updated', label: 'Order Updated' },
  { value: 'communication_added', label: 'Communication Added' }
] as const;

const timeRanges = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom Range' }
];

export default function Activities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | 'all'>('all');
  const [timeRange, setTimeRange] = useState('today');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | 'all'>('all');
  const { activities, initialize } = useActivityStore();
  const { user } = useAuthStore();
  const { canViewAllActivities } = usePermissions();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const cleanup = initialize();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [initialize]);

  useEffect(() => {
    const uniqueUsers = activities.reduce((acc, activity) => {
      if (activity.userId && activity.userName && !acc.some(u => u.id === activity.userId)) {
        acc.push({ id: activity.userId, name: activity.userName });
      }
      return acc;
    }, [] as Array<{ id: string; name: string }>);
    
    setUsers(uniqueUsers);
  }, [activities]);

  const formatMetadata = (metadata: Record<string, any>) => {
    if (!metadata) return [];

    const formatValue = (value: any): string => {
      if (typeof value === 'object' && value !== null) {
        return Object.entries(value)
          .filter(([key]) => key !== 'updatedAt') // Filter out updatedAt
          .map(([k, v]) => `${formatKey(k)}: ${formatValue(v)}`)
          .join(', ');
      }
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'string') {
        return formatKey(value);
      }
      return String(value);
    };

    const formatKey = (key: string): string => {
      // Add space before capital letters and handle special cases
      return key
        .split(/(?=[A-Z])/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/\s+/g, ' ') // Remove extra spaces
        .replace(/\b(Id|Url)\b/gi, match => match.toUpperCase()) // Handle common abbreviations
        .replace(/\bPdf\b/gi, 'PDF')
        .trim();
    };

    return Object.entries(metadata)
      .filter(([key]) => 
        !key.startsWith('_') && 
        key !== 'updatedAt' && 
        metadata[key] !== undefined && 
        metadata[key] !== null
      )
      .map(([key, value]) => ({
        key: formatKey(key),
        value: formatValue(value)
      }));
  };

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

  const getFilteredActivities = () => {
    let filteredByDate = activities;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeRange === 'custom' && customStartDate && customEndDate) {
      filteredByDate = activities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= customStartDate && activityDate <= customEndDate;
      });
    } else {
      switch (timeRange) {
        case 'today':
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= today;
          });
          break;
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= yesterday && activityDate < today;
          });
          break;
        case '7d':
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= sevenDaysAgo;
          });
          break;
        case '30d':
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= thirtyDaysAgo;
          });
          break;
        case '3m':
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= threeMonthsAgo;
          });
          break;
        case '12m':
          const twelveMonthsAgo = new Date(today);
          twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
          filteredByDate = activities.filter(activity => {
            const activityDate = new Date(activity.createdAt);
            return activityDate >= twelveMonthsAgo;
          });
          break;
      }
    }

    return filteredByDate.filter(activity => {
      const matchesSearch = searchTerm === '' || 
        activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || activity.type === selectedType;
      const matchesUser = selectedUserId === 'all' || activity.userId === selectedUserId;
      const hasPermission = canViewAllActivities || activity.userId === user?.id;

      return matchesSearch && matchesType && matchesUser && hasPermission;
    });
  };

  const filteredActivities = getFilteredActivities();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {canViewAllActivities ? 'All Activities' : 'My Activities'}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input w-full dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ActivityType | 'all')}
              className="modern-select pl-10 pr-10 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="all">All Activities</option>
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="modern-select pl-10 pr-10 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {canViewAllActivities && (
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all" className="text-gray-900 dark:text-gray-100">All Users</option>
                {users.map((user) => (
                  <option 
                    key={user.id} 
                    value={user.id}
                    className="text-gray-900 dark:text-gray-100"
                  >
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredActivities.length === 0 ? (
            <li className="p-6 text-center text-gray-500 dark:text-gray-400">
              No activities found
            </li>
          ) : (
            filteredActivities.map((activity) => (
              <li key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-start space-x-3">
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.message}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.createdAt.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {activity.userName}
                    </p>
                    {activity.metadata && (
                      <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 space-y-1">
                        {formatMetadata(activity.metadata).map(({ key, value }, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">{key}:</span> {value}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {showDatePicker && (
        <DateRangePicker
          onSelect={handleDateRangeSelect}
          onClose={() => setShowDatePicker(false)}
          initialStartDate={customStartDate}
          initialEndDate={customEndDate}
        />
      )}

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