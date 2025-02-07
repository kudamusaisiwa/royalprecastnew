# Royal Precast Order Tracking System

## Overview
A simple and efficient tracking system that allows customers to monitor their order's progress through production and delivery, similar to FedEx's tracking system. Customers can instantly check their order status by entering their order tracking number.

## Tracking System

### Order Tracking Flow
1. Customer enters order tracking number on the main page
   - Format: RP-YYYYMMDD-XXXX (e.g., RP-20240118-0001)
2. System instantly displays:
   - Current order status
   - Production timeline
   - Estimated completion date
   - Delivery information (when applicable)

### Key Features
- No login required - just enter tracking number
- Mobile-friendly interface
- Real-time status updates
- Shareable tracking links
- Optional email notifications for status changes

## Portal Structure

### Main Components

1. Tracking Search (`src/pages/TrackOrder.tsx`)
   - Large, centered tracking number input
   - Quick track button
   - Recent tracking numbers (stored in local storage)

2. Order Status Display
   - Visual timeline showing all stages:
     * Order Received → In Production → Quality Check → Ready for Delivery → Delivered
   - Current stage highlighted
   - Estimated completion time
   - Detailed progress information

## Data Model

### Order Data
```typescript
interface Order {
    id: string
    trackingNumber: string
    customerName: string
    phoneNumber: string
    email?: string
    deliveryAddress: string
    products: OrderProduct[]
    status: OrderStatus
    productionProgress: number
    expectedDeliveryDate: Date
    totalAmount: number
    amountPaid: number
    balance: number
}

interface OrderProduct {
    productId: string
    name: string
    quantity: number
    specifications: string
    status: ProductionStatus
}

enum OrderStatus {
    ORDER_RECEIVED = 'order_received',
    IN_PRODUCTION = 'in_production',
    QUALITY_CHECK = 'quality_check',
    READY_FOR_DELIVERY = 'ready_for_delivery',
    DELIVERED = 'delivered'
}

enum ProductionStatus {
    PREPARING = 'preparing',           // Initial stage of IN_PRODUCTION
    MIXING = 'mixing',                // During IN_PRODUCTION
    CASTING = 'casting',              // During IN_PRODUCTION
    CURING = 'curing',                // During IN_PRODUCTION
    QUALITY_INSPECTION = 'inspection', // During QUALITY_CHECK
    APPROVED = 'approved',            // After QUALITY_CHECK, before READY_FOR_DELIVERY
    PACKAGED = 'packaged'             // READY_FOR_DELIVERY
}
```

## Features

### 1. Order Tracking
- View order details and specifications
- Track production progress
- Monitor quality control status
- Access delivery information

### 2. Production Timeline
- Real-time production status updates
- Estimated completion dates
- Quality control checkpoints
- Production milestone notifications

### 3. Delivery Information
- Expected delivery dates
- Delivery address confirmation
- Contact details for delivery
- Special handling instructions

### 4. Payment Information
- View total order amount
- Track payments made
- Check remaining balance
- View payment history

## User Interface & Progress Tracking

### Real-Time Progress Tracking
Inspired by modern food delivery apps, the portal features an intuitive progress tracking system:

1. Visual Progress Timeline
   - Large, prominent progress bar at the top of the screen
   - Clear status indicators for each phase:
     * Order Received → In Production → Quality Check → Ready for Delivery → Delivered
   - Current phase highlighted with brand colors
   - Completed phases marked with checkmarks
   - Estimated time remaining prominently displayed

2. Status Cards
   - Each production phase displayed as a card
   - Current phase expanded to show detailed information
   - Cards include:
     * Phase icon and title
     * Status description
     * Timestamp for phase updates
     * Progress percentage within each phase

3. Push Notifications
   - Real-time updates when order moves to next phase
   - Optional SMS notifications for major milestones
   - Email notifications for important updates
   - Ability to customize notification preferences

### Mobile-First Design

1. Main Dashboard
   - Large order status card at the top
   - Pull-to-refresh for latest updates
   - Quick action buttons for common tasks
   - Smooth animations for status changes

2. Progress Details
   - Swipeable cards for different aspects of the order
   - Interactive timeline that expands on tap
   - Photo updates of production progress
   - Easy access to delivery information

3. Navigation
   - Bottom navigation bar for main sections
   - Floating action button for quick contact
   - Gesture-based interactions
   - Smooth transitions between screens

### Key UI Components

1. Progress Tracker
```typescript
interface ProgressPhase {
    id: string
    title: string
    description: string
    status: 'completed' | 'current' | 'upcoming'
    percentage: number
    estimatedCompletion: Date
    updates: StatusUpdate[]
}

interface StatusUpdate {
    timestamp: Date
    message: string
    type: 'milestone' | 'update' | 'delay'
    imageUrl?: string
}
```

2. Interactive Elements
   - Tap to expand phase details
   - Long press for quick actions
   - Double tap to mark important updates
   - Swipe between different orders

3. Visual Feedback
   - Color-coded status indicators
   - Progress animations
   - Loading skeletons
   - Success/error states

### Accessibility Features

1. Visual Accessibility
   - High contrast mode
   - Adjustable text size
   - Color-blind friendly indicators
   - Clear iconography

2. Screen Readers
   - ARIA labels
   - Semantic HTML
   - Keyboard navigation
   - Voice-over support

### Customer Communication

1. In-App Updates
   - Status change notifications
   - Production milestone alerts
   - Delivery preparation notices
   - Quality check confirmations

2. External Communications
   - SMS status updates
   - Email notifications
   - WhatsApp integration option
   - Push notifications

### Performance Optimization

1. Real-Time Updates
   - WebSocket connections for live status
   - Efficient data polling
   - Optimistic UI updates
   - Offline support

2. Resource Management
   - Lazy loading of images
   - Progressive web app capabilities
   - Background data syncing
   - Cache management

## Security Considerations

1. Authentication
   - Order reference validation
   - Session management
   - Error handling

2. Data Access
   - Order-specific access control
   - Secure data fetching
   - Protected routes

3. Session Management
   - Automatic logout on inactivity
   - Secure session storage
   - Clear error handling

## Technical Implementation

### Firebase Integration
- Uses Firestore for order data storage
- Real-time updates for production status
- Secure authentication

### State Management
- Centralized state using stores
- Reactive updates
- Error boundary implementation

### UI/UX Features
- Mobile-responsive design
- Progress indicators
- Loading states
- Toast notifications for status updates

## Error Handling
- Invalid order reference
- Network errors
- Session expiration
