# Payment System Documentation

This document outlines the payment system implementation in the Royal Precast CRM, including its data structures, components, and business logic.

## Data Structures

### Payment Interface
```typescript
interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  notes?: string;
  date: Date;
  createdAt: Date;
}
```

### Payment Method Types
```typescript
type PaymentMethod = 'bank_transfer' | 'cash' | 'ecocash' | 'innbucks';
```

### Payment Status Types
```typescript
type PaymentStatus = 'unpaid' | 'partial' | 'paid';
```

## State Management

### Payment Store
The payment system uses Zustand for state management with the following key features:

```typescript
interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  addPayment: (paymentData: Partial<Payment>) => Promise<string>;
  getPaymentsByOrder: (orderId: string) => Payment[];
  getTotalPaidForOrder: (orderId: string) => number;
}
```

## Core Features

### 1. Payment Processing

#### Adding Payments
```typescript
const addPayment = async (paymentData: Partial<Payment>) => {
  // Validate payment data
  // Add payment to database
  // Update order total paid amount
  // Create activity log
  // Complete related tasks
  // Send notifications
};
```

#### Payment Calculation
```typescript
const getTotalPaidForOrder = (orderId: string) => {
  // Get all payments for order
  // Calculate total amount paid
  // Return sum
};
```

### 2. Payment Management UI

The payment management interface provides:
- List of unpaid invoices
- Payment status tracking
- Payment method selection
- Payment recording
- Customer and order navigation

Features include:
- Search functionality
- Pagination
- Status filtering
- Payment modal
- Toast notifications

## Integration with Other Modules

### 1. Order System Integration
- Tracks order payment status
- Updates order total paid amount
- Links payments to specific orders
- Manages order status based on payments

### 2. Task System Integration
```typescript
interface TaskMetadata {
  type?: 'follow_up' | 'general';
  autoCreated?: boolean;
  completedReason?: 'payment_received' | 'manual' | 'cancelled';
  paymentId?: string;
}
```

### 3. Activity Logging
```typescript
type ActivityType = 
  | 'payment_created'
  | 'payment_updated'
  | 'payment_deleted';
```

## Payment Workflow

### 1. Recording a Payment

1. User selects an unpaid invoice
2. Opens payment modal
3. Enters payment details:
   - Payment method
   - Amount
   - Reference (optional)
   - Notes (optional)
4. System processes payment:
   - Creates payment record
   - Updates order status
   - Completes related tasks
   - Sends notifications

### 2. Payment Tracking

1. System maintains payment history
2. Calculates remaining balance
3. Updates payment status
4. Generates activity logs

## Security and Validation

### 1. Access Control
- Role-based access to payment features
- Payment management permissions
- Audit trail of payment activities

### 2. Data Validation
```typescript
// Payment amount validation
if (amount <= 0) {
  throw new Error('Invalid payment amount');
}

// Payment method validation
if (!['bank_transfer', 'cash', 'ecocash', 'innbucks'].includes(method)) {
  throw new Error('Invalid payment method');
}
```

### 3. Error Handling
- Validation errors
- Database errors
- Network errors
- Duplicate payments

## User Interface Components

### 1. Payment Method Modal
```typescript
interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    method: PaymentMethod,
    amount: number,
    notes?: string,
    reference?: string
  ) => void;
  order: Order;
}
```

### 2. Payment Status Badge
```typescript
const getStatusBadgeVariant = (status: OperationalStatus) => {
  switch (status) {
    case 'quotation':
      return 'bg-gray-100 text-gray-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    // ... other statuses
  }
};
```

## Best Practices

### 1. Payment Processing
- Validate all payment data
- Maintain transaction history
- Handle partial payments
- Track payment methods
- Record payment references

### 2. User Experience
- Clear payment status
- Simple payment process
- Error feedback
- Success confirmation
- Payment history access

### 3. Data Integrity
- Payment validation
- Order status sync
- Balance calculation
- Activity logging
- Error recovery

## Common Issues and Solutions

### 1. Payment Conflicts
- Handle concurrent payments
- Prevent duplicate payments
- Resolve payment disputes
- Track payment changes

### 2. Data Synchronization
- Order status updates
- Payment status sync
- Balance calculations
- Task completion

### 3. Error Recovery
- Failed payments
- Network issues
- Database errors
- User mistakes

## Reporting and Analytics

### 1. Payment Reports
- Payment history
- Payment methods
- Success rates
- Error rates

### 2. Financial Analytics
- Revenue tracking
- Payment trends
- Method preferences
- Outstanding balances

## Future Enhancements

1. **Payment Integration**
   - Online payment gateways
   - Mobile money integration
   - Automated reconciliation
   - Payment scheduling

2. **User Experience**
   - Bulk payments
   - Payment templates
   - Recurring payments
   - Payment reminders

3. **Analytics**
   - Advanced reporting
   - Payment predictions
   - Risk assessment
   - Fraud detection
