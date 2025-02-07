import React, { useState, useRef } from 'react';
import { X, Upload, AlertTriangle, Download } from 'lucide-react';
import { useCustomerStore } from '../../store/customerStore';
import Toast from '../ui/Toast';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportCustomersModal({ isOpen, onClose }: ImportCustomersModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addCustomer } = useCustomerStore();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csvData = event.target?.result as string;
        const customers = parseCSV(csvData);
        
        // Process each customer
        for (const customer of customers) {
          await addCustomer({
            firstName: customer.firstName,
            lastName: customer.lastName,
            companyName: customer.companyName || null,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            notes: customer.notes || null,
            rating: 0,
            totalOrders: 0,
            totalRevenue: 0
          });
        }

        setToastMessage(`Successfully imported ${customers.length} customers`);
        setToastType('success');
        setShowToast(true);
        onClose();
      } catch (error: any) {
        setToastMessage(error.message || 'Failed to import customers');
        setToastType('error');
        setShowToast(true);
      } finally {
        setLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (csvData: string) => {
    const lines = csvData.split('\n');
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Validate required headers
    const requiredHeaders = ['firstname', 'lastname', 'email', 'phone', 'address'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
        return {
          firstName: values[headers.indexOf('firstname')],
          lastName: values[headers.indexOf('lastname')],
          companyName: values[headers.indexOf('companyname')] || '',
          email: values[headers.indexOf('email')],
          phone: values[headers.indexOf('phone')],
          address: values[headers.indexOf('address')],
          notes: values[headers.indexOf('notes')] || ''
        };
      });
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'FirstName,LastName,CompanyName,Email,Phone,Address,Notes',
      'John,Doe,ABC Company,john.doe@example.com,+263712345678,"123 Main St, Harare","Preferred delivery time: morning"',
      'Jane,Smith,,jane.smith@example.com,+263723456789,"456 Park Ave, Bulawayo","Weekend deliveries only"'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customer_import_sample.csv';
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <Upload className="h-6 w-6 text-gray-400 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Import Customers</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    CSV Format Requirements
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Required columns:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>FirstName</li>
                      <li>LastName</li>
                      <li>Email</li>
                      <li>Phone</li>
                      <li>Address</li>
                    </ul>
                    <p className="mt-2">Optional columns:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>CompanyName</li>
                      <li>Notes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={downloadSampleCSV}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample CSV
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Importing...' : 'Select CSV File'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
}