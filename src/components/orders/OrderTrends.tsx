import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useOrderStore } from '../../store/orderStore';

interface OrderTrendsProps {
  timeRange: string;
}

export default function OrderTrends({ timeRange }: OrderTrendsProps) {
  const { getOrderTrends } = useOrderStore();
  const data = getOrderTrends(timeRange);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-medium text-gray-900">Order Trends</h2>
      <div className="mt-6" style={{ height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}