import React from 'react';
import type { Product } from '../../store/productStore';

interface OrderSummaryProps {
  products: Product[];
  selectedProducts: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  onCreateOrder: () => void;
}

export default function OrderSummary({
  products,
  selectedProducts,
  onCreateOrder
}: OrderSummaryProps) {
  // Calculate totals with VAT extraction
  const totalWithVAT = selectedProducts.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  
  // Since prices include 15% VAT, we need to extract it
  // Formula: VAT amount = Total including VAT - (Total including VAT / 1.15)
  const subtotalExVAT = totalWithVAT / 1.15;
  const vatAmount = totalWithVAT - subtotalExVAT;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Summary</h2>

      <div className="space-y-4">
        {/* Selected Products List */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          {selectedProducts.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            const itemTotal = item.quantity * item.unitPrice;
            const itemSubtotal = itemTotal / 1.15;
            
            return (
              <div key={index} className="flex justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {product?.name} x {item.quantity.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ${item.unitPrice.toFixed(2)} each
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  ${itemSubtotal.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal (excl. VAT)</span>
            <span className="text-gray-900 dark:text-white">${subtotalExVAT.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">VAT (15%)</span>
            <span className="text-gray-900 dark:text-white">${vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-900 dark:text-white">Total (incl. VAT)</span>
            <span className="text-gray-900 dark:text-white">${totalWithVAT.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onCreateOrder}
            disabled={selectedProducts.length === 0}
            className="w-full inline-flex justify-center items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600"
          >
            Create Order
          </button>
        </div>
      </div>
    </div>
  );
}