import React, { useState } from 'react';
import { Plus, Trash, Search } from 'lucide-react';
import type { Product } from '../../store/productStore';

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  onAddProduct: (productId: string, quantity: number, unitPrice: number) => void;
  onRemoveProduct: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
}

export default function ProductSelector({
  products,
  selectedProducts,
  onAddProduct,
  onRemoveProduct,
  onUpdateQuantity
}: ProductSelectorProps) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [errors, setErrors] = useState({
    quantity: '',
    unitPrice: ''
  });

  const filteredProducts = products.filter(product => {
    const searchStr = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchStr) ||
      product.category.toLowerCase().includes(searchStr) ||
      product.description?.toLowerCase().includes(searchStr)
    );
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id);
    setUnitPrice(product.basePrice);
    setQuantity(product.minQuantity);
    setErrors({ quantity: '', unitPrice: '' });
    setSearchTerm(product.name);
    setShowResults(false);
  };

  const validateProduct = () => {
    const newErrors = {
      quantity: '',
      unitPrice: ''
    };

    const selectedProduct = products.find(p => p.id === selectedProductId);
    if (selectedProduct) {
      if (quantity < selectedProduct.minQuantity) {
        newErrors.quantity = `Minimum quantity is ${selectedProduct.minQuantity}`;
      }
      if (unitPrice <= 0) {
        newErrors.unitPrice = 'Unit price must be greater than 0';
      }
      if (unitPrice < selectedProduct.basePrice * 0.5) {
        newErrors.unitPrice = `Minimum price is $${(selectedProduct.basePrice * 0.5).toFixed(2)}`;
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleAdd = () => {
    if (selectedProductId && validateProduct()) {
      onAddProduct(selectedProductId, quantity, unitPrice);
      setSelectedProductId('');
      setQuantity(0);
      setUnitPrice(0);
      setErrors({ quantity: '', unitPrice: '' });
    }
  };

  const handleQuantityChange = (value: number, index?: number) => {
    if (index !== undefined) {
      // Updating existing product
      const product = products.find(p => p.id === selectedProducts[index].productId);
      if (product && value >= product.minQuantity) {
        onUpdateQuantity(index, value);
      }
    } else {
      // Adding new product
      setQuantity(value);
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>

      <div className="space-y-4">
        {/* Product Selection Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="search-input dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              
              {showResults && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ${product.basePrice}/{product.unit} - {product.category}
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
              className={`modern-input ${errors.quantity ? 'border-red-500' : ''}`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Unit Price ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={unitPrice}
              onChange={(e) => {
                setUnitPrice(parseFloat(e.target.value) || 0);
                if (errors.unitPrice) {
                  setErrors(prev => ({ ...prev, unitPrice: '' }));
                }
              }}
              className={`modern-input ${errors.unitPrice ? 'border-red-500' : ''}`}
            />
            {errors.unitPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={!selectedProductId || quantity <= 0 || unitPrice <= 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>

        {/* Selected Products List */}
        {selectedProducts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-3">Selected Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
                  {selectedProducts.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {product?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <input
                            type="number"
                            min={product?.minQuantity || 1}
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0, index)}
                            className="modern-input w-24"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <button
                            onClick={() => onRemoveProduct(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}