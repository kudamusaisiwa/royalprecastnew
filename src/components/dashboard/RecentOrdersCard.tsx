import React from 'react';
import { Link } from 'react-router-dom';
import { useCustomerStore } from '../../store/customerStore';
import OrderStatusBadge from '../orders/OrderStatusBadge';
import type { Order } from '../../types';

interface RecentOrdersCardProps {
  orders: Order[];
}

export default function RecentOrdersCard({ orders }: RecentOrdersCardProps) {
  const { getCustomerById } = useCustomerStore();
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Orders</h2>
      <div className="flow-root">
        <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
          {recentOrders.map((order) => {
            const customer = getCustomerById(order.customerId);
            return (
              <li key={order.id} className="py-4">
                <div className="flex items-center justify-between">
                  <Link 
                    to={`/orders/${order.id}`}
                    className="min-w-0 flex-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md px-2 py-1"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          Order #{order.id}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-shrink-0 items-center space-x-4">
                        <OrderStatusBadge status={order.status} />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ${order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-6">
          <Link
            to="/orders/all"
            className="flex items-center justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-inset ring-blue-300 dark:ring-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50"
          >
            View all orders
          </Link>
        </div>
      </div>
    </div>
  );
}