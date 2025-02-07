# Order Creation Technical Documentation

This document outlines the technical process of creating an order in the Royal Precast CRM system.

## Overview

The order creation process involves multiple steps and collections in Firestore. It handles customer information, product selection, payment details, and generates necessary documents and tracking information.

## Data Structure

### Order Document
```typescript
interface Order {
  id: string;                 // Auto-generated Firestore ID
  orderNumber: string;        // Format: RP-YYYYMMDD-XXX
  customerId: string;         // Reference to customers collection
  status: OrderStatus;        // enum: 'pending' | 'confirmed' | 'production' | 'ready' | 'delivered'
  items: OrderItem[];         // Array of ordered products
  totalAmount: number;        // Total order amount
  paidAmount: number;         // Amount paid so far
  balance: number;           // Remaining balance
  deliveryAddress: Address;  // Delivery location
  createdAt: Timestamp;      // Order creation date
  updatedAt: Timestamp;      // Last update date
  createdBy: string;         // User ID who created the order
  notes?: string;            // Optional order notes
  deliveryDate?: Timestamp;  // Scheduled delivery date
  trackingNumber: string;    // Public tracking number
}

interface OrderItem {
  productId: string;         // Reference to products collection
  quantity: number;          // Number of items ordered
  unitPrice: number;         // Price per unit
  totalPrice: number;        // quantity * unitPrice
  notes?: string;           // Optional item-specific notes
}

interface Address {
  street: string;
  city: string;
  province: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

## Process Flow

1. **Customer Selection/Creation**
   ```typescript
   // Check if customer exists
   const customer = await getCustomerByEmail(email);
   
   // If not, create new customer
   if (!customer) {
     customerId = await createCustomer({
       name,
       email,
       phone,
       address
     });
   }
   ```

2. **Order Number Generation**
   ```typescript
   // Format: RP-YYYYMMDD-XXX
   const generateOrderNumber = async () => {
     const date = format(new Date(), 'yyyyMMdd');
     const count = await getTodayOrderCount();
     return `RP-${date}-${(count + 1).toString().padStart(3, '0')}`;
   };
   ```

3. **Product Validation**
   ```typescript
   // Verify product availability and prices
   const validateProducts = async (items: OrderItem[]) => {
     for (const item of items) {
       const product = await getProduct(item.productId);
       if (!product || product.stock < item.quantity) {
         throw new Error(`Product ${product.name} not available in requested quantity`);
       }
     }
   };
   ```

4. **Order Creation**
   ```typescript
   const createOrder = async (orderData: OrderInput) => {
     // Start a transaction
     return await runTransaction(db, async (transaction) => {
       // Generate order number
       const orderNumber = await generateOrderNumber();
       
       // Calculate totals
       const totalAmount = calculateTotal(orderData.items);
       
       // Create order document
       const orderRef = doc(collection(db, 'orders'));
       transaction.set(orderRef, {
         ...orderData,
         orderNumber,
         totalAmount,
         paidAmount: 0,
         balance: totalAmount,
         status: 'pending',
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp(),
         trackingNumber: generateTrackingNumber()
       });
       
       // Update product stock
       for (const item of orderData.items) {
         const productRef = doc(db, 'products', item.productId);
         transaction.update(productRef, {
           stock: increment(-item.quantity)
         });
       }
       
       return orderRef.id;
     });
   };
   ```

5. **Initial Payment Processing**
   ```typescript
   const processInitialPayment = async (orderId: string, payment: PaymentInput) => {
     const paymentRef = await addDoc(collection(db, 'payments'), {
       orderId,
       amount: payment.amount,
       method: payment.method,
       reference: payment.reference,
       createdAt: serverTimestamp(),
       status: 'completed'
     });
     
     // Update order paid amount
     await updateDoc(doc(db, 'orders', orderId), {
       paidAmount: increment(payment.amount),
       balance: increment(-payment.amount),
       status: 'confirmed'
     });
   };
   ```

## Activity Logging

Every order creation automatically generates activity logs:

```typescript
const logOrderActivity = async (orderId: string, action: string) => {
  await addDoc(collection(db, 'activities'), {
    type: 'order',
    action,
    orderId,
    timestamp: serverTimestamp(),
    userId: auth.currentUser?.uid,
    details: {
      orderNumber,
      status,
      amount
    }
  });
};
```

## Security Rules

Orders can only be created by users with appropriate roles:

```javascript
match /orders/{orderId} {
  allow create: if hasRole(['admin', 'manager', 'finance']);
}
```

## Notifications

Order creation triggers several notifications:

1. **Email Notifications**
   - Customer receives order confirmation
   - Finance team notified of new order
   - Production team notified if order is confirmed

2. **In-App Notifications**
   - Relevant team members notified
   - Updates appear in activity feed

## Error Handling

The order creation process includes comprehensive error handling:

```typescript
try {
  // Validate input
  validateOrderInput(orderData);
  
  // Check customer credit limit
  await validateCustomerCredit(customerId, totalAmount);
  
  // Create order
  const orderId = await createOrder(orderData);
  
  // Process payment
  if (payment) {
    await processInitialPayment(orderId, payment);
  }
  
  // Log activity
  await logOrderActivity(orderId, 'created');
  
  // Send notifications
  await sendOrderNotifications(orderId);
  
} catch (error) {
  // Log error
  await logError('order_creation', error);
  
  // Rollback if needed
  if (orderId) {
    await rollbackOrder(orderId);
  }
  
  throw new Error('Failed to create order: ' + error.message);
}
```

## Related Collections

The order creation process interacts with several collections:
- `orders`: Main order data
- `customers`: Customer information
- `products`: Product inventory
- `payments`: Payment records
- `activities`: Audit logs
- `notifications`: System notifications

## Testing

When testing order creation:
1. Verify all required fields
2. Check stock updates
3. Validate payment processing
4. Confirm notification delivery
5. Test error scenarios
6. Verify security rules

## Common Issues

1. **Concurrent Stock Updates**
   - Use transactions to prevent race conditions
   - Implement stock reservation system

2. **Payment Validation**
   - Verify payment amount matches order
   - Handle payment failures gracefully

3. **Customer Data**
   - Validate customer information
   - Handle new vs existing customers

## Best Practices

1. Always use transactions for multi-document updates
2. Validate all input data server-side
3. Log all significant actions
4. Handle errors gracefully
5. Send appropriate notifications
6. Update stock in real-time
7. Maintain audit trail
