import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Phone } from 'lucide-react';
import { useCustomerStore } from '../../store/customerStore';

export default function CustomerSearchCard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { customers } = useCustomerStore();

  const filteredCustomers = customers
    .filter(customer => {
      const searchStr = searchTerm.toLowerCase();
      return (
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchStr) ||
        customer.email.toLowerCase().includes(searchStr) ||
        customer.phone.includes(searchStr)
      );
    })
    .slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Search</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="search-input dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
        
        {showResults && searchTerm && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600">
            {filteredCustomers.map((customer) => (
              <Link
                key={customer.id}
                to={`/customers/${customer.id}`}
                className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-0"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {customer.firstName} {customer.lastName}
                </div>
                <div className="mt-1 flex flex-col space-y-1">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Mail className="h-4 w-4 mr-2" />
                    {customer.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Phone className="h-4 w-4 mr-2" />
                    {customer.phone}
                  </div>
                </div>
              </Link>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No customers found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}