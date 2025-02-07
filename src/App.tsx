import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { useCustomerStore } from '@/store/customerStore';
import { useOrderStore } from '@/store/orderStore';
import { useProductStore } from '@/store/productStore';
import { useActivityStore } from '@/store/activityStore';
import { useUserStore } from '@/store/userStore';
import { usePaymentStore } from '@/store/paymentStore';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import Orders from '@/pages/Orders';
import AllOrders from '@/pages/AllOrders';
import OrderDetails from '@/pages/OrderDetails';
import Products from '@/pages/Products';
import AddProduct from '@/pages/AddProduct';
import ProductDetails from '@/pages/ProductDetails';
import Activities from '@/pages/Activities';
import Users from '@/pages/Users';
import AddUser from '@/pages/AddUser';
import Reports from '@/pages/Reports';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import PaymentManagement from '@/pages/PaymentManagement';
import Help from '@/pages/Help';
import Chat from '@/pages/Chat';
import SiteVisits from '@/pages/SiteVisits';
import PrivateRoute from '@/components/auth/PrivateRoute';
import { Toaster } from "@/components/ui/toaster";
import LegacyToast from "@/components/ui/LegacyToast";
import Deliveries from '@/pages/Deliveries';
import DeliveryHistory from '@/pages/DeliveryHistory';
import Collections from '@/pages/Collections';
import Tasks from '@/pages/Tasks';
import TrackOrder from '@/pages/TrackOrder';
import Settings from '@/pages/Settings';
import CustomerFeedback from '@/pages/CustomerFeedback';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React error boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Something went wrong</h1>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const { isDarkMode } = useThemeStore();
  const { canViewUsers } = usePermissions();
  const { isAuthenticated } = useAuthStore();
  const { error: authError, clearError: clearAuthError } = useAuthStore();
  const { initialize: initCustomers } = useCustomerStore();
  const { initialize: initOrders } = useOrderStore();
  const { initialize: initProducts } = useProductStore();
  const { initialize: initActivities } = useActivityStore();
  const { initialize: initUsers } = useUserStore();
  const { initialize: initPayments } = usePaymentStore();

  // Handle dark mode
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initialize stores when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const initializeStores = async () => {
        try {
          const cleanupFunctions = await Promise.all([
            initCustomers(),
            initOrders(),
            initProducts(),
            initActivities(),
            initUsers(),
            initPayments()
          ]);

          return () => {
            cleanupFunctions.forEach(cleanup => {
              if (typeof cleanup === 'function') {
                cleanup();
              }
            });
          };
        } catch (error) {
          console.error('Error initializing stores:', error);
          return () => {};
        }
      };

      const cleanup = initializeStores();
      return () => {
        cleanup.then(cleanupFn => cleanupFn());
      };
    }
  }, [isAuthenticated, initCustomers, initOrders, initProducts, initActivities, initUsers, initPayments]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/track" element={<TrackOrder />} />
            
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/all" element={<AllOrders />} />
              <Route path="orders/:id" element={<OrderDetails />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:productId" element={<ProductDetails />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="activities" element={<Activities />} />
              <Route path="deliveries" element={<Deliveries />} />
              <Route path="delivery-history" element={<DeliveryHistory />} />
              <Route path="site-visits" element={<SiteVisits />} />
              <Route path="collections" element={<Collections />} />
              <Route path="settings" element={<Settings />} />
              <Route path="payments" element={<PaymentManagement />} />
              <Route path="chat" element={<Chat />} />
              <Route path="help" element={<Help />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="reports" element={<Reports />} />
              <Route path="feedback" element={<CustomerFeedback />} />
              {canViewUsers ? (
                <>
                  <Route path="users" element={<Users />} />
                  <Route path="users/add" element={<AddUser />} />
                </>
              ) : (
                <Route path="users/*" element={<Navigate to="/" replace />} />
              )}
            </Route>
          </Routes>

          {authError && (
            <Toast
              message={authError}
              type="error"
              onClose={clearAuthError}
            />
          )}
        </BrowserRouter>
        <Toaster />
      </ToastProvider>
    </ErrorBoundary>
  );
}