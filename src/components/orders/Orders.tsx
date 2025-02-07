import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../../store/orderStore';
import { useNotificationStore } from '../../store/notificationStore';
import { playPositiveSound } from '../../utils/audio';

const handleCreateOrder = async () => {
  if (!selectedCustomer) return;

  const orderProducts = selectedProducts.map(({ productId, quantity, unitPrice }) => {
    const product = products.find(p => p.id === productId);
    return {
      id: productId,
      name: product?.name || '',
      quantity,
      unitPrice
    };
  });

  const totalAmount = selectedProducts.reduce(
    (sum, { quantity, unitPrice }) => sum + quantity * unitPrice,
    0
  );

  try {
    const orderId = await addOrder({
      customerId: selectedCustomer.id,
      products: orderProducts,
      status: 'quotation',
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deliveryMethod: 'delivery', // Default to delivery
      paymentStatus: 'pending',
      totalAmount,
      customerAddress: selectedCustomer.address || '',
      customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      customerEmail: selectedCustomer.email || '',
      customerPhone: selectedCustomer.phone || '',
      notes: []
    });

    playPositiveSound();
    
    // Add notification
    addNotification({
      message: `New order created for ${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      type: 'order'
    });

    // Navigate to the new order
    navigate(`/orders/${orderId}`);
    
  } catch (error) {
    console.error('Error creating order:', error);
    addNotification({
      message: 'Failed to create order. Please try again.',
      type: 'error'
    });
  }
};

// ... rest of the file remains unchanged ...