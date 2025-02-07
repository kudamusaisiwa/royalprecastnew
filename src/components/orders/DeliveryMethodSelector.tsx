import React, { useState } from 'react';
import { Truck, Package, MapPin, AlertTriangle, X } from 'lucide-react';

interface DeliveryMethodSelectorProps {
  value: 'delivery' | 'collection' | 'site_visit';
  onChange: (method: 'delivery' | 'collection' | 'site_visit') => void;
  deliveryDate?: Date;
  collectionDate?: Date;
  siteVisitDate?: Date;
  onDateChange: (type: 'delivery' | 'collection' | 'site_visit', date?: Date) => void;
}

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  newMethod 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  newMethod: 'delivery' | 'collection' | 'site_visit';
}) {
  if (!isOpen) return null;

  const methodDisplay = {
    delivery: 'delivery',
    collection: 'collection',
    site_visit: 'site visit'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Change Delivery Method
            </h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to change the method to {methodDisplay[newMethod]}? 
            This will clear any previously set dates.
          </p>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DeliveryMethodSelector({
  value,
  onChange,
  deliveryDate,
  collectionDate,
  siteVisitDate,
  onDateChange
}: DeliveryMethodSelectorProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<'delivery' | 'collection' | 'site_visit' | null>(null);

  const handleMethodClick = (method: 'delivery' | 'collection' | 'site_visit') => {
    if (method === value) return;
    setPendingMethod(method);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (pendingMethod) {
      onChange(pendingMethod);
      // Clear all other dates
      if (pendingMethod !== 'delivery') onDateChange('delivery', undefined);
      if (pendingMethod !== 'collection') onDateChange('collection', undefined);
      if (pendingMethod !== 'site_visit') onDateChange('site_visit', undefined);
    }
    setShowConfirmation(false);
    setPendingMethod(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => handleMethodClick('delivery')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
            value === 'delivery'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Truck className={`h-6 w-6 ${
            value === 'delivery' ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <span className={`mt-2 text-sm font-medium ${
            value === 'delivery' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'
          }`}>
            Delivery
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMethodClick('collection')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
            value === 'collection'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Package className={`h-6 w-6 ${
            value === 'collection' ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <span className={`mt-2 text-sm font-medium ${
            value === 'collection' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'
          }`}>
            Collection
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMethodClick('site_visit')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border ${
            value === 'site_visit'
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <MapPin className={`h-6 w-6 ${
            value === 'site_visit' ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <span className={`mt-2 text-sm font-medium ${
            value === 'site_visit' ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'
          }`}>
            Site Visit
          </span>
        </button>
      </div>

      {value === 'delivery' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Delivery Date
          </label>
          <input
            type="datetime-local"
            value={deliveryDate?.toISOString().slice(0, 16) || ''}
            onChange={(e) => onDateChange('delivery', e.target.value ? new Date(e.target.value) : undefined)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700"
          />
        </div>
      )}

      {value === 'collection' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Collection Date
          </label>
          <input
            type="datetime-local"
            value={collectionDate?.toISOString().slice(0, 16) || ''}
            onChange={(e) => onDateChange('collection', e.target.value ? new Date(e.target.value) : undefined)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700"
          />
        </div>
      )}

      {value === 'site_visit' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Site Visit Date
          </label>
          <input
            type="datetime-local"
            value={siteVisitDate?.toISOString().slice(0, 16) || ''}
            onChange={(e) => onDateChange('site_visit', e.target.value ? new Date(e.target.value) : undefined)}
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700"
          />
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingMethod(null);
        }}
        onConfirm={handleConfirm}
        newMethod={pendingMethod || 'delivery'}
      />
    </div>
  );
}