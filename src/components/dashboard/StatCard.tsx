import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
  details?: {
    label: string;
    value: string;
  }[];
}

export default function StatCard({ 
  title, 
  value, 
  subValue,
  change, 
  trend, 
  icon: Icon,
  color,
  details
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow dark:shadow-gray-700">
      <div className="absolute right-6 top-6">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <div className="mt-2 flex items-baseline">
        <p className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
        {subValue && (
          <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            ({subValue})
          </p>
        )}
      </div>
      {details && (
        <div className="mt-4 space-y-1">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">{detail.label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex items-center">
        {trend === 'up' ? (
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span
          className={`ml-2 text-sm font-medium ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {change}
        </span>
      </div>
    </div>
  );
}