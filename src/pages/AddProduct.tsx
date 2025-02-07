import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import Toast from '../components/ui/Toast';

interface ProductFormData {
  name: string;
  category: string;
  minQuantity: string;
  basePrice: string;
  unit: string;
  description: string;
  imageUrl: string;
}

export default function AddProduct() {
  const navigate = useNavigate();
  const { addProduct } = useProductStore();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    minQuantity: '0.1',
    basePrice: '0',
    unit: 'piece',
    description: '',
    imageUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        minQuantity: parseFloat(formData.minQuantity) || 0.1,
        basePrice: parseFloat(formData.basePrice) || 0,
        unit: formData.unit,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim()
      };

      // Validate data
      if (!productData.name) {
        throw new Error('Product name is required');
      }
      if (!productData.category) {
        throw new Error('Category is required');
      }
      if (productData.minQuantity <= 0) {
        throw new Error('Minimum quantity must be greater than 0');
      }
      if (productData.basePrice < 0) {
        throw new Error('Base price cannot be negative');
      }

      await addProduct(productData);
      setToastMessage('Product added successfully');
      setToastType('success');
      setShowToast(true);

      // Navigate after a short delay to show the success message
      setTimeout(() => {
        navigate('/products');
      }, 2000);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add product');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Product</h1>
        <Package className="h-6 w-6 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Product Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="modern-input mt-1"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category *
          </label>
          <input
            type="text"
            id="category"
            required
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="modern-input mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Minimum Quantity *
            </label>
            <input
              type="number"
              id="minQuantity"
              required
              min="0.1"
              step="0.1"
              value={formData.minQuantity}
              onChange={(e) => handleInputChange('minQuantity', e.target.value)}
              className="modern-input mt-1"
            />
          </div>

          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Base Price ($) *
            </label>
            <input
              type="number"
              id="basePrice"
              required
              min="0"
              step="0.01"
              value={formData.basePrice}
              onChange={(e) => handleInputChange('basePrice', e.target.value)}
              className="modern-input mt-1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Unit *
          </label>
          <select
            id="unit"
            required
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className="modern-select mt-1"
          >
            <option value="piece">Piece</option>
            <option value="meter">Meter</option>
            <option value="square_meter">Square Meter</option>
            <option value="cubic_meter">Cubic Meter</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="modern-textarea mt-1"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Image URL
          </label>
          <input
            type="url"
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => handleInputChange('imageUrl', e.target.value)}
            className="modern-input mt-1"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-800"
          >
            {loading ? 'Adding...' : 'Add Product'}
          </button>
        </div>
      </form>

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