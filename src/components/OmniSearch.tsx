import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Users, 
  Package, 
  ClipboardList, 
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import { useCustomerStore } from '../store/customerStore';
import { useOrderStore } from '../store/orderStore';
import { useProductStore } from '../store/productStore';

type SearchResult = {
  id: string;
  type: 'customer' | 'order' | 'product';
  title: string;
  subtitle?: string;
  metadata?: string[];
  link: string;
};

export default function OmniSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const { customers } = useCustomerStore();
  const { orders } = useOrderStore();
  const { products } = useProductStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    // Search customers
    customers.forEach(customer => {
      const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
      if (
        fullName.includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        (customer.companyName && customer.companyName.toLowerCase().includes(term))
      ) {
        searchResults.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: `${customer.firstName} ${customer.lastName}`,
          subtitle: customer.companyName || undefined,
          metadata: [
            customer.email,
            customer.phone,
            customer.address
          ],
          link: `/customers/${customer.id}`
        });
      }
    });

    // Search orders
    orders.forEach(order => {
      const customer = customers.find(c => c.id === order.customerId);
      if (
        order.id.toLowerCase().includes(term) ||
        (customer && `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(term))
      ) {
        searchResults.push({
          id: `order-${order.id}`,
          type: 'order',
          title: `Order #${order.id}`,
          subtitle: customer ? `${customer.firstName} ${customer.lastName}` : undefined,
          metadata: [
            `Status: ${order.status}`,
            `Amount: $${order.totalAmount.toLocaleString()}`
          ],
          link: `/orders/${order.id}`
        });
      }
    });

    // Search products
    products.forEach(product => {
      if (
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term)
      ) {
        searchResults.push({
          id: `product-${product.id}`,
          type: 'product',
          title: product.name,
          subtitle: product.category,
          metadata: [
            `Price: $${product.basePrice.toFixed(2)}`,
            `Min Qty: ${product.minQuantity}`
          ],
          link: `/products/${product.id}`
        });
      }
    });

    setResults(searchResults);
  }, [searchTerm, customers, orders, products]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleResultClick(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'customer':
        return Users;
      case 'order':
        return ClipboardList;
      case 'product':
        return Package;
      default:
        return Search;
    }
  };

  const getMetadataIcon = (text: string) => {
    if (text.includes('@')) return Mail;
    if (text.includes('+')) return Phone;
    if (text.includes('Status')) return Calendar;
    if (text.includes('Amount') || text.includes('Price')) return Building;
    return MapPin;
  };

  return (
    <>
      <div ref={searchRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers, orders, products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border-0 bg-gray-50 dark:bg-gray-700 pl-10 pr-4 py-2.5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
            <div className="max-h-[60vh] overflow-y-auto">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                return (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`px-4 py-3 cursor-pointer ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/50'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.subtitle}
                          </div>
                        )}
                        {result.metadata && result.metadata.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {result.metadata.map((meta, i) => {
                              const MetaIcon = getMetadataIcon(meta);
                              return (
                                <div
                                  key={i}
                                  className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400"
                                >
                                  <MetaIcon className="h-3 w-3 mr-1" />
                                  {meta}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}