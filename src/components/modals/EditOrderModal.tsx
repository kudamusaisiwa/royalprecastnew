import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Order } from '../../types';
import ProductSelector from '../orders/ProductSelector';
import { useProductStore } from '../../store/productStore';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => void;
  order: Order;
}

export default function EditOrderModal({ isOpen, onClose, onSave, order }: EditOrderModalProps) {
  const { products } = useProductStore();
  const [selectedProducts, setSelectedProducts] = useState(order.products);
  const [deliveryMethod, setDeliveryMethod] = useState(order.deliveryMethod);
  
  // Handle optional dates
  const [deliveryDate, setDeliveryDate] = useState(
    order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : ''
  );
  const [collectionDate, setCollectionDate] = useState(
    order.collectionDate ? order.collectionDate.toISOString().split('T')[0] : ''
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const totalAmount = selectedProducts.reduce(
      (sum, product) => sum + product.quantity * product.unitPrice,
      0
    );

    const orderData: Partial<Order> = {
      products: selectedProducts,
      deliveryMethod,
      totalAmount,
      vatAmount: totalAmount * 0.15 // 15% VAT
    };

    // Only add dates if they are set
    if (deliveryDate) {
      orderData.deliveryDate = new Date(deliveryDate);
    }

    if (collectionDate) {
      orderData.collectionDate = new Date(collectionDate);
    }

    onSave(orderData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="absolute right-4 top-4">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-6 w-6" />
            </button>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Order #{order.id}</h2>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Method
                </label>
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value as 'delivery' | 'collection')}
                  className="modern-select mt-1"
                >
                  <option value="delivery">Delivery</option>
                  <option value="collection">Collection</option>
                </select>
              </div>

              {deliveryMethod === 'delivery' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="modern-input mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Collection Date
                  </label>
                  <input
                    type="date"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="modern-input mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products</h3>
              <ProductSelector
                products={products}
                selectedProducts={selectedProducts.map(p => ({
                  productId: p.id,
                  quantity: p.quantity,
                  unitPrice: p.unitPrice
                }))}
                onAddProduct={(productId, quantity, unitPrice) => {
                  const product = products.find(p => p.id === productId);
                  if (product) {
                    setSelectedProducts([...selectedProducts, {
                      id: productId,
                      name: product.name,
                      quantity,
                      unitPrice
                    }]);
                  }
                }}
                onRemoveProduct={(index) => {
                  setSelectedProducts(prev => prev.filter((_, i) => i !== index));
                }}
                onUpdateQuantity={(index, quantity) => {
                  setSelectedProducts(prev => prev.map((p, i) => 
                    i === index ? { ...p, quantity } : p
                  ));
                }}
              />
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
              onClick={handleSave}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}