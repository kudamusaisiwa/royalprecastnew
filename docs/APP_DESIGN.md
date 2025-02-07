# Royal Precast CRM Design Documentation

This document outlines the design, styling, and functionality of the Royal Precast CRM application.

## Design System

### 1. Theme Configuration
The app uses a customized Tailwind CSS configuration with:

```javascript
// Theme Colors
{
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  popover: "hsl(var(--popover))",
}

// Breakpoints
{
  screens: {
    "2xl": "1400px",
  }
}
```

### 2. Dark Mode Support
- System uses CSS classes for dark mode
- Toggleable via theme store
- Persisted user preference
- Automatic system preference detection

## Layout Structure

### 1. Main Layout
```typescript
Layout
├── TopBar
├── Sidebar
│   └── Navigation Items
├── Main Content Area
└── Footer
```

### 2. Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive padding and spacing
- Adaptive layouts for different screen sizes

### 3. Navigation Structure
```typescript
const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Customers', icon: Users, href: '/customers' },
  { name: 'Create Order', icon: PlusCircle, href: '/orders' },
  { name: 'All Orders', icon: ClipboardList, href: '/orders/all' },
  { name: 'My Tasks', icon: CheckSquare, href: '/tasks' },
  { name: 'Payments', icon: CreditCard, href: '/payments' },
  { name: 'Products', icon: Package, href: '/products' },
  { name: 'Activities', icon: Activity, href: '/activities' },
  { name: 'Deliveries', icon: Truck, href: '/deliveries' },
  { name: 'Site Visits', icon: MapPin, href: '/site-visits' },
  { name: 'Chat', icon: MessageSquare, href: '/chat' },
  { name: 'Reports', icon: BarChart3, href: '/reports' },
  { name: 'Help', icon: HelpCircle, href: '/help' }
];
```

## Features and Functionality

### 1. Authentication System
- Login/Logout functionality
- Password reset flow
- Protected routes
- Role-based access control
- Session management

### 2. Core Modules

#### Dashboard
- Overview statistics
- Recent activities
- Quick actions
- Performance metrics

#### Customer Management
- Customer profiles
- Order history
- Communication logs
- Financial status

#### Order Processing
- Order creation
- Status tracking
- Delivery management
- Payment integration

#### Task Management
- Task assignment
- Progress tracking
- Due dates
- Priority levels

#### Communication
- Internal chat
- Customer notifications
- Email integration
- SMS alerts

### 3. Data Management

#### State Management
```typescript
// Core Stores
- useAuthStore
- useCustomerStore
- useOrderStore
- useProductStore
- useActivityStore
- useUserStore
- usePaymentStore
- useThemeStore
```

#### Data Initialization
```typescript
// Automatic store initialization on auth
React.useEffect(() => {
  if (isAuthenticated) {
    initCustomers();
    initOrders();
    initProducts();
    initActivities();
    initUsers();
    initPayments();
  }
}, [isAuthenticated]);
```

## User Interface Components

### 1. Common Components
- Buttons
- Forms
- Cards
- Tables
- Modals
- Toasts
- Popovers
- Dropdowns

### 2. Specialized Components
- Data grids
- Charts
- File uploaders
- Rich text editors
- Date pickers
- Multi-select inputs

## User Experience

### 1. Navigation
- Intuitive menu structure
- Breadcrumb navigation
- Quick actions
- Search functionality
- Recent items

### 2. Interactions
- Smooth transitions
- Loading states
- Error handling
- Success feedback
- Form validation

### 3. Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast

## Performance Optimization

### 1. Loading Strategies
- Lazy loading routes
- Component code splitting
- Image optimization
- Cache management

### 2. State Management
- Efficient updates
- Batch processing
- Data normalization
- Memory management

## Error Handling

### 1. Error Boundary
```typescript
class ErrorBoundary extends React.Component {
  // Catches JavaScript errors
  // Displays fallback UI
  // Logs errors for debugging
  // Prevents app crashes
}
```

### 2. Error States
- Form validation errors
- API error handling
- Network error recovery
- Graceful degradation

## Best Practices

### 1. Code Organization
- Feature-based structure
- Reusable components
- Consistent naming
- Clear documentation

### 2. Performance
- Minimize re-renders
- Optimize bundle size
- Cache API responses
- Lazy load assets

### 3. Security
- Input validation
- XSS prevention
- CSRF protection
- Secure authentication

### 4. Maintenance
- Clear documentation
- Type safety
- Code comments
- Version control

## Development Guidelines

### 1. Component Creation
- Use TypeScript
- Follow naming conventions
- Include prop types
- Add documentation

### 2. Styling
- Use Tailwind classes
- Follow theme system
- Maintain consistency
- Support dark mode

### 3. State Management
- Use appropriate stores
- Handle side effects
- Manage subscriptions
- Clean up resources

### 4. Testing
- Unit tests
- Integration tests
- E2E tests
- Performance tests
