import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';

interface DateRangePickerProps {
  // New interface props
  startDate?: Date | null;
  endDate?: Date | null;
  onApply?: (startDate: Date | null, endDate: Date | null) => void;
  onCancel?: () => void;

  // Legacy interface props
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  onSelect?: (startDate: Date | null, endDate: Date | null) => void;
  onClose?: () => void;
}

export default function DateRangePicker({
  // Support both new and legacy props
  startDate: propsStartDate,
  endDate: propsEndDate,
  onApply,
  onCancel,
  initialStartDate: legacyStartDate,
  initialEndDate: legacyEndDate,
  onSelect,
  onClose
}: DateRangePickerProps) {
  // Use either new or legacy props
  const initialStartDate = propsStartDate || legacyStartDate;
  const initialEndDate = propsEndDate || legacyEndDate;
  const handleApply = onApply || onSelect;
  const handleCancel = onCancel || onClose;
  const [startDate, setStartDate] = useState(
    initialStartDate ? formatDate(initialStartDate) : formatDate(new Date())
  );
  const [endDate, setEndDate] = useState(
    initialEndDate ? formatDate(initialEndDate) : formatDate(new Date())
  );
  const [error, setError] = useState<string | null>(null);

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set end date to end of day

    if (start > end) {
      setError('Start date must be before or equal to end date');
      return;
    }

    setError(null);
    if (handleApply) {
      handleApply(start, end);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button 
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-500"
              type="button"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Select Date Range
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setError(null);
                    }}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setError(null);
                    }}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-5 sm:mt-6 flex space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}