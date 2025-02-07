import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { initializeSampleData } from '../utils/initializeData';
import Toast from './ui/Toast';

export default function DummyDataButton() {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleAddDummyData = async () => {
    setLoading(true);
    try {
      await initializeSampleData();
      setToastMessage('Sample data added successfully');
      setToastType('success');
    } catch (error) {
      console.error('Error adding dummy data:', error);
      setToastMessage('Failed to add sample data');
      setToastType('error');
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  return (
    <>
      <button
        onClick={handleAddDummyData}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4 mr-2" />
        {loading ? 'Adding...' : 'Add Sample Data'}
      </button>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}