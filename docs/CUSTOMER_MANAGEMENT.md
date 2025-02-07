# Customer Management and Interactions

This document outlines how customers are created and managed in the Royal Precast CRM system, including their interactions with orders and payments.

## Customer Data Structure

```typescript
interface Customer {
  id: string;                 // Auto-generated Firestore ID
  customerNumber: string;     // Format: RC-YYYY-XXXX
  type: 'individual' | 'company';
  status: 'active' | 'inactive';
  
  // Basic Information
  name: string;              // Full name or company name
  email: string;             // Primary contact email
  phone: string;             // Primary contact number
  alternatePhone?: string;   // Secondary contact number
  
  // Company Specific
  registrationNumber?: string;  // Company registration
  vatNumber?: string;          // VAT registration number
  industryType?: string;       // Type of business
  
  // Contact Person (for companies)
  contactPerson?: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  
  // Address Information
  addresses: {
    billing: Address;
    delivery?: Address[];    // Multiple delivery addresses
  };
  
  // Financial Information
  creditLimit: number;       // Maximum credit allowed
  currentBalance: number;    // Current outstanding balance
  paymentTerms?: string;     // e.g., "30 days", "COD"
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;        // User ID who created the customer
  lastOrderDate?: Timestamp;
  totalOrders: number;
  totalSpent: number;
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
  isDefault: boolean;
}
```

## Customer Creation Process

### 1. Initial Creation
```typescript
const createCustomer = async (customerData: CustomerInput) => {
  // Generate customer number
  const customerNumber = await generateCustomerNumber();
  
  // Create customer document
  const customerRef = doc(collection(db, 'customers'));
  await setDoc(customerRef, {
    ...customerData,
    customerNumber,
    status: 'active',
    creditLimit: 0,          // Default credit limit
    currentBalance: 0,
    totalOrders: 0,
    totalSpent: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid
  });
  
  // Log activity
  await logCustomerActivity(customerRef.id, 'created');
  
  return customerRef.id;
};
```

### 2. Validation Rules
```javascript
match /customers/{customerId} {
  allow create: if hasRole(['admin', 'manager', 'finance']) &&
    request.resource.data.email.matches('^[^@]+@[^@]+$') &&
    request.resource.data.phone.matches('^[0-9+\\s-]{10,15}$');
}
```

## Customer Interactions

### 1. Order Management

#### Placing Orders
```typescript
interface OrderPlacement {
  // Check credit limit before order
  const canPlaceOrder = async (customerId: string, orderAmount: number) => {
    const customer = await getCustomer(customerId);
    return (customer.creditLimit - customer.currentBalance) >= orderAmount;
  };
  
  // Update customer stats after order
  const updateCustomerOrderStats = async (customerId: string, orderAmount: number) => {
    await updateDoc(doc(db, 'customers', customerId), {
      totalOrders: increment(1),
      totalSpent: increment(orderAmount),
      currentBalance: increment(orderAmount),
      lastOrderDate: serverTimestamp()
    });
  };
}
```

#### Order History
```typescript
const getCustomerOrders = async (customerId: string) => {
  const ordersRef = collection(db, 'orders');
  const q = query(
    ordersRef,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  return await getDocs(q);
};
```

### 2. Payment Management

#### Processing Payments
```typescript
const processCustomerPayment = async (
  customerId: string,
  amount: number,
  paymentMethod: string
) => {
  const batch = writeBatch(db);
  
  // Create payment record
  const paymentRef = doc(collection(db, 'payments'));
  batch.set(paymentRef, {
    customerId,
    amount,
    method: paymentMethod,
    status: 'completed',
    createdAt: serverTimestamp()
  });
  
  // Update customer balance
  const customerRef = doc(db, 'customers', customerId);
  batch.update(customerRef, {
    currentBalance: increment(-amount),
    updatedAt: serverTimestamp()
  });
  
  await batch.commit();
};
```

#### Payment History
```typescript
const getCustomerPayments = async (customerId: string) => {
  const paymentsRef = collection(db, 'payments');
  const q = query(
    paymentsRef,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  
  return await getDocs(q);
};
```

## Customer Portal Access

Customers can access a limited portal to:
1. View order history
2. Track current orders
3. View payment history
4. Update contact information

```typescript
// Customer portal authentication
const customerPortalAccess = async (customerEmail: string) => {
  // Generate temporary access link
  const link = await generateCustomerPortalLink({
    email: customerEmail,
    expiresIn: 3600 // 1 hour
  });
  
  // Send access link via email
  await sendCustomerPortalLink(customerEmail, link);
};
```

## Notifications

### 1. Order Related
```typescript
const sendOrderNotifications = async (customerId: string, orderId: string) => {
  // Send order confirmation
  await sendOrderConfirmationEmail(customerId, orderId);
  
  // Send SMS notification if enabled
  await sendOrderSMS(customerId, orderId);
  
  // Create in-app notification
  await createNotification({
    type: 'order',
    customerId,
    orderId,
    message: 'New order created'
  });
};
```

### 2. Payment Related
```typescript
const sendPaymentNotifications = async (customerId: string, paymentId: string) => {
  // Send payment receipt
  await sendPaymentReceiptEmail(customerId, paymentId);
  
  // Send payment confirmation SMS
  await sendPaymentSMS(customerId, paymentId);
};
```

## Customer Analytics

```typescript
interface CustomerAnalytics {
  // Order frequency
  averageOrderValue: number;
  orderFrequency: number;
  
  // Payment behavior
  averagePaymentTime: number;
  paymentReliability: number;
  
  // Product preferences
  mostOrderedProducts: Array<{
    productId: string;
    quantity: number;
  }>;
}

const generateCustomerAnalytics = async (customerId: string) => {
  // Fetch customer history
  const orders = await getCustomerOrders(customerId);
  const payments = await getCustomerPayments(customerId);
  
  // Calculate metrics
  return calculateCustomerMetrics(orders, payments);
};
```

## Best Practices

1. **Data Validation**
   - Validate all customer information server-side
   - Ensure required fields are provided
   - Validate email and phone formats

2. **Credit Management**
   - Regular credit limit reviews
   - Automated credit holds
   - Payment term compliance monitoring

3. **Communication**
   - Keep communication history
   - Document all interactions
   - Regular status updates

4. **Security**
   - Encrypt sensitive information
   - Limit access to financial data
   - Audit all changes

## Common Issues and Solutions

1. **Duplicate Customers**
   - Check existing records before creation
   - Merge duplicate records when found
   - Maintain unique identifiers

2. **Credit Limit Violations**
   - Automated credit checks
   - Order holds when limit exceeded
   - Notification to finance team

3. **Contact Information Updates**
   - Regular verification
   - Bounce handling
   - Multiple contact points

## Related Collections

- `customers`: Main customer data
- `orders`: Customer orders
- `payments`: Payment records
- `activities`: Customer interactions
- `notifications`: Communication history
- `analytics`: Customer metrics

## Monitoring and Maintenance

1. **Regular Reviews**
   - Credit limit reviews
   - Contact information updates
   - Payment term reviews

2. **Data Quality**
   - Address verification
   - Email validation
   - Phone number verification

3. **Performance Monitoring**
   - Payment history
   - Order frequency
   - Credit utilization
