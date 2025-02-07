import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore } from '../store/customerStore';
import { useProductStore } from '../store/productStore';
import { useOrderStore } from '../store/orderStore';
import { useNotificationStore } from '../store/notificationStore';
import { useToast } from "../components/ui/use-toast";
import { Input } from "../components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import type { Customer } from '../types';
import CustomerSelector from '../components/orders/CustomerSelector';
import ProductSelector from '../components/orders/ProductSelector';
import OrderSummary from '../components/orders/OrderSummary';
import DeliveryMethodSelector from '../components/orders/DeliveryMethodSelector';
import AddCustomerModal from '../components/modals/AddCustomerModal';
import Toast from '../components/ui/Toast';

export default function Orders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerReferenceNumber, setCustomerReferenceNumber] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'collection' | 'site_visit'>('delivery');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [collectionDate, setCollectionDate] = useState<Date>();
  const [siteVisitDate, setSiteVisitDate] = useState<Date>();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const { addCustomer } = useCustomerStore();
  const { products, initialize: initProducts } = useProductStore();
  const { addOrder, initialize: initOrders } = useOrderStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        const cleanupFunctions = await Promise.all([
          initOrders(),
          initProducts()
        ]);
        return () => {
          cleanupFunctions.forEach(cleanup => {
            if (typeof cleanup === 'function') {
              cleanup();
            }
          });
        };
      } catch (error) {
        console.error('Error initializing data:', error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    };

    const cleanupPromise = initializeData();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [initOrders, initProducts]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const orderProducts = selectedProducts.map(({ productId, quantity, unitPrice }) => {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error(`Product ${productId} not found`);
        return {
          id: productId,
          name: product.name,
          quantity,
          unitPrice
        };
      });

      const totalAmount = selectedProducts.reduce(
        (sum, { quantity, unitPrice }) => sum + quantity * unitPrice,
        0
      );

      const vatAmount = totalAmount - (totalAmount / 1.15); // Extract VAT from total

      const orderId = await addOrder({
        customerId: selectedCustomer.id,
        customerReferenceNumber: customerReferenceNumber || undefined,
        products: orderProducts,
        status: 'quotation',
        deliveryMethod,
        deliveryDate,
        collectionDate,
        siteVisitDate,
        totalAmount,
        vatAmount,
        paidAmount: 0,
        partPayments: [],
        collectionStatus: 'pending'
      });

      addNotification({
        message: `New order created for ${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
        type: 'order'
      });

      toast({
        title: "Success",
        description: "Order created and follow-up task assigned",
      });

      // Navigate to the order details page
      navigate(`/orders/${orderId}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order",
        variant: "destructive",
      });
    }
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'totalOrders' | 'totalRevenue'>) => {
    try {
      const customerId = await addCustomer(customerData);
      setToastMessage('Customer added successfully');
      setToastType('success');
      setShowToast(true);
      setShowAddCustomerModal(false);
      
      // Select the newly created customer
      setSelectedCustomer({
        id: customerId,
        ...customerData,
        rating: 0,
        totalOrders: 0,
        totalRevenue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      setToastMessage('Failed to add customer');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading order data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create Order</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Select a customer and add their reference number if needed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CustomerSelector
              onSelectCustomer={setSelectedCustomer}
              selectedCustomer={selectedCustomer}
              onNewCustomer={() => setShowAddCustomerModal(true)}
            />
            
            {selectedCustomer && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Reference Number (Optional)
                </div>
                <Input
                  id="customerRef"
                  placeholder="Enter customer's reference number"
                  value={customerReferenceNumber}
                  onChange={(e) => setCustomerReferenceNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  If the customer has provided a reference number, enter it here
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedCustomer && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Select products and specify quantities</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSelector
                  products={products}
                  selectedProducts={selectedProducts}
                  onAddProduct={(productId, quantity, unitPrice) => {
                    setSelectedProducts(prev => [...prev, { productId, quantity, unitPrice }]);
                  }}
                  onRemoveProduct={(index) => {
                    setSelectedProducts(prev => prev.filter((_, i) => i !== index));
                  }}
                  onUpdateQuantity={(index, quantity) => {
                    setSelectedProducts(prev => prev.map((item, i) => 
                      i === index ? { ...item, quantity } : item
                    ));
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Method</CardTitle>
                <CardDescription>Choose how the order will be fulfilled</CardDescription>
              </CardHeader>
              <CardContent>
                <DeliveryMethodSelector
                  value={deliveryMethod}
                  onChange={setDeliveryMethod}
                  deliveryDate={deliveryDate}
                  collectionDate={collectionDate}
                  siteVisitDate={siteVisitDate}
                  onDateChange={(type, date) => {
                    if (type === 'delivery') {
                      setDeliveryDate(date);
                      setCollectionDate(undefined);
                      setSiteVisitDate(undefined);
                    } else if (type === 'collection') {
                      setCollectionDate(date);
                      setDeliveryDate(undefined);
                      setSiteVisitDate(undefined);
                    } else {
                      setSiteVisitDate(date);
                      setDeliveryDate(undefined);
                      setCollectionDate(undefined);
                    }
                  }}
                />
              </CardContent>
            </Card>

            <OrderSummary
              products={products}
              selectedProducts={selectedProducts}
              onCreateOrder={handleCreateOrder}
            />
          </>
        )}
      </div>

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onAdd={handleAddCustomer}
      />

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