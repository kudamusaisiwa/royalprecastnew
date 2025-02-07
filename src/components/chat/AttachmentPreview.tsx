import React from 'react';
import { X, Users, Package, CreditCard } from 'lucide-react';

interface AttachmentPreviewProps {
  attachment: {
    type: 'customer' | 'order' | 'payment';
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
  };
  onRemove: () => void;
}

export default function AttachmentPreview({ attachment, onRemove }: AttachmentPreviewProps) {
  const Icon = {
    customer: Users,
    order: Package,
    payment: CreditCard
  }[attachment.type];

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 mt-0.5 text-gray-500 dark:text-gray-400" />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {attachment.title}
          </div>
          {attachment.subtitle && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {attachment.subtitle}
            </div>
          )}
          {attachment.amount !== undefined && (
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              ${attachment.amount.toLocaleString()}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}