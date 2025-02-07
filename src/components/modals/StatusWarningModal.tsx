import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { OrderStatus } from '../../types';

interface StatusWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentStatus: OrderStatus;
  newStatus: OrderStatus;
}

export default function StatusWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentStatus,
  newStatus
}: StatusWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Warning</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              You are about to change the order status from{' '}
              <span className="font-medium text-gray-700">
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
              </span>{' '}
              to{' '}
              <span className="font-medium text-gray-700">
                {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
              </span>
              .
            </p>

            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important Notice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>This action will be recorded in the activity log</li>
                      <li>All related payment records will be preserved</li>
                      <li>This action cannot be automatically reversed</li>
                      <li>You may need manager approval for future status changes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Confirm Status Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}