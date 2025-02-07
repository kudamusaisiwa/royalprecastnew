import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Bell, CheckCircle, CreditCard, UserPlus, Package, Info, AlertTriangle, MessageSquare } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useActivityStore } from '../store/activityStore';
import type { Notification } from '../store/notificationStore';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationConfig = (type: Notification['type']) => {
  switch (type) {
    case 'status':
      return { emoji: '🔄', icon: CheckCircle, color: 'bg-blue-50 dark:bg-blue-900/50' };
    case 'payment':
      return { emoji: '💰', icon: CreditCard, color: 'bg-green-50 dark:bg-green-900/50' };
    case 'customer':
      return { emoji: '👤', icon: UserPlus, color: 'bg-purple-50 dark:bg-purple-900/50' };
    case 'order':
      return { emoji: '📦', icon: Package, color: 'bg-orange-50 dark:bg-orange-900/50' };
    case 'mention':
      return { emoji: '💬', icon: MessageSquare, color: 'bg-indigo-50 dark:bg-indigo-900/50' };
    case 'error':
      return { emoji: '⚠️', icon: AlertTriangle, color: 'bg-red-50 dark:bg-red-900/50' };
    default:
      return { emoji: 'ℹ️', icon: Info, color: 'bg-gray-50 dark:bg-gray-900/50' };
  }
};

export default function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { notifications, markAllAsRead, clearNotifications } = useNotificationStore();
  const { initialize: initializeActivities } = useActivityStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (isOpen) {
      const initActivities = async () => {
        try {
          const cleanup = await initializeActivities();
          if (typeof cleanup === 'function') {
            return cleanup;
          }
          return undefined;
        } catch (error) {
          console.error('Error initializing activities:', error);
          return undefined;
        }
      };

      const cleanupPromise = initActivities();
      return () => {
        cleanupPromise.then(cleanup => cleanup && cleanup());
      };
    }
  }, [isOpen, initializeActivities]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 z-50">
      <div className="w-full sm:w-96 bg-white dark:bg-gray-800 rounded-b-lg sm:rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium">Notifications</h3>
              {unreadCount > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 flex justify-end space-x-2">
            <button
              onClick={markAllAsRead}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Mark all as read
            </button>
            <button
              onClick={clearNotifications}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] sm:max-h-[calc(100vh-16rem)] overflow-y-auto p-2 space-y-2">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => {
              const { emoji, color } = getNotificationConfig(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`${color} rounded-xl p-4 shadow-sm transition-all duration-200 ${
                    !notification.read ? 'transform translate-y-0 scale-100' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                      {notification.metadata?.mentionedBy && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          by {notification.metadata.mentionedBy}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}