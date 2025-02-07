import React from 'react';
import { Plus, Upload, Download } from 'lucide-react';

interface CustomerListHeaderProps {
  onAddClick: () => void;
  onImportClick: () => void;
  onExportClick: () => void;
  canManageCustomers: boolean;
}

export default function CustomerListHeader({
  onAddClick,
  onImportClick,
  onExportClick,
  canManageCustomers
}: CustomerListHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customers</h1>
      {canManageCustomers && (
        <div className="flex space-x-3">
          <button
            onClick={onImportClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            onClick={onExportClick}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={onAddClick}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </button>
        </div>
      )}
    </div>
  );
}