import { create } from 'zustand';
import { 
  collection, 
  doc,
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  setDoc,
  deleteDoc,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import { usePaymentStore } from './paymentStore';
import { useTaskStore } from './taskStore';
import { useCustomerStore } from './customerStore';
import { playPositiveSound, playNegativeSound } from '../utils/audio';
import { getDateRange, getDatesInRange, formatDateForDisplay } from '../utils/dateRange';
import type { Order, OperationalStatus, PaymentMethod, PaymentStatus } from '../types';

interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  initialize: () => Promise<(() => void) | undefined>;
  addOrder: (orderData: Partial<Order>) => Promise<string>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OperationalStatus, paymentMethod?: PaymentMethod, paymentAmount?: number, paymentNotes?: string) => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getPaymentStatus: (orderId: string) => PaymentStatus;
  getOrderStats: (timeRange: string, customStartDate?: Date | null, customEndDate?: Date | null) => {
    totalOrders: number;
    activeCustomers: number;
    revenue: number;
    pendingOrders: number;
    pendingRevenue: number;
    orderChange: number;
    customerChange: number;
    revenueChange: number;
    pendingChange: number;
  };
  getOrderTrends: (timeRange: string, customStartDate?: Date | null, customEndDate?: Date | null) => Array<{
    name: string;
    revenue: number;
    outstanding: number;
  }>;
}

const generateOrderId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `RPC${year}${month}${day}${sequence}`;
};

const calculateTotalAmount = (products: any[]) => {
  return products.reduce((sum, product) => sum + product.quantity * product.unitPrice, 0);
};

export const useOrderStore = create<OrderState>(
  createProtectedStore((set, get) => ({
    orders: [],
    loading: false,
    error: null,
    currentPage: 1,
    itemsPerPage: 10,
    searchTerm: '',
    selectedStatus: 'all',
    hideQuotations: false,

    setCurrentPage: (page: number) => set({ currentPage: page }),
    setItemsPerPage: (items: number) => set({ itemsPerPage: items }),
    setSearchTerm: (term: string) => set({ searchTerm: term }),
    setSelectedStatus: (status: string) => set({ selectedStatus: status }),
    setHideQuotations: (hide: boolean) => set({ hideQuotations: hide }),
    clearError: () => set({ error: null }),

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const orders = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              deliveryDate: doc.data().deliveryDate?.toDate() || null,
              collectionDate: doc.data().collectionDate?.toDate() || null
            })) as Order[];

            set({ orders, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching orders:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing orders:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addOrder: async (orderData: Partial<Order>) => {
      try {
        const { user } = useAuthStore.getState();
        const { addTask } = useTaskStore.getState();
        const { logActivity } = useActivityStore.getState();
        const { getCustomerById } = useCustomerStore.getState();
        
        // Clean the order data to remove undefined values
        const cleanOrderData = Object.fromEntries(
          Object.entries(orderData).filter(([_, v]) => v !== undefined && v !== null)
        );

        // Get customer details
        const customer = await getCustomerById(cleanOrderData.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown';

        // Set default delivery date if not provided
        if (!cleanOrderData.deliveryDate) {
          cleanOrderData.deliveryDate = Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          );
        }
        
        // Generate order ID
        const orderId = generateOrderId();
        
        // Create order with our custom ID
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, {
          ...cleanOrderData,
          id: orderId,
          customerName,
          createdBy: user?.id,
          createdAt: Timestamp.now()
        });

        // Calculate follow-up due date (3 days from now)
        const followUpDueDate = new Date();
        followUpDueDate.setDate(followUpDueDate.getDate() + 3);

        // Create task data with required fields
        const taskData = {
          title: `Follow Up Client: ${customerName}`,
          status: 'pending',
          priority: 'medium',
          dueDate: followUpDueDate,
          assignees: [{
            userId: user?.id || '',
            userName: user?.name || user?.email || ''
          }],
          orderId: orderId,
          orderNumber: orderId,
          customerId: cleanOrderData.customerId,
          customerName,
          metadata: {
            type: 'follow_up',
            autoCreated: true
          }
        };

        // Create follow-up task
        await addTask(taskData);

        // Log activity
        if (user) {
          await logActivity({
            type: 'order_created',
            message: `Created new order ${orderId} for ${customerName}`,
            userId: user.id,
            userName: user.name || user.email || '',
            entityId: orderId,
            entityType: 'order',
            metadata: {
              orderId: orderId,
              orderNumber: orderId,
              customerId: cleanOrderData.customerId,
              totalAmount: cleanOrderData.totalAmount,
              status: cleanOrderData.status
            }
          });
        }

        return orderId;
      } catch (error) {
        console.error('Error creating order and follow-up task:', error);
        throw error;
      }
    },

    updateOrder: async (id, orderData) => {
      try {
        set({ loading: true });
        const orderRef = doc(db, 'orders', id);
        
        const updatedData = {
          ...orderData,
          updatedAt: Timestamp.now(),
          deliveryDate: orderData.deliveryDate ? Timestamp.fromDate(orderData.deliveryDate) : null,
          collectionDate: orderData.collectionDate ? Timestamp.fromDate(orderData.collectionDate) : null
        };

        await updateDoc(orderRef, updatedData);

        // Update customer stats if total amount changed
        if (orderData.totalAmount !== undefined) {
          const order = get().orders.find(o => o.id === id);
          if (order) {
            const customerRef = doc(db, 'customers', order.customerId);
            const customerOrders = get().orders.filter(o => o.customerId === order.customerId);
            const totalOrders = customerOrders.length;
            const totalRevenue = customerOrders.reduce((sum, o) => {
              return sum + (o.id === id ? orderData.totalAmount! : o.totalAmount);
            }, 0);

            await updateDoc(customerRef, {
              totalOrders,
              totalRevenue,
              updatedAt: Timestamp.now()
            });
          }
        }

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'order_updated',
            message: `Order #${id} updated: ${Object.keys(orderData).join(', ')}`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'order',
            metadata: {
              orderId: id,
              changes: Object.keys(orderData)
            }
          });
        }

        playPositiveSound();
        set({ loading: false, error: null });
      } catch (error: any) {
        playNegativeSound();
        console.error('Error updating order:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteOrder: async (id) => {
      try {
        set({ loading: true });
        const order = get().orders.find(o => o.id === id);
        if (!order) throw new Error('Order not found');

        const orderRef = doc(db, 'orders', id);
        await deleteDoc(orderRef);

        // Update customer stats
        const customerRef = doc(db, 'customers', order.customerId);
        const customerOrders = get().orders.filter(o => o.customerId === order.customerId && o.id !== id);
        const totalOrders = customerOrders.length;
        const totalRevenue = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        await updateDoc(customerRef, {
          totalOrders,
          totalRevenue,
          updatedAt: Timestamp.now()
        });

        // Update local state to remove the deleted order
        const updatedOrders = get().orders.filter(o => o.id !== id);
        set({ orders: updatedOrders, loading: false, error: null });

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'order_deleted',
            message: `Order #${id} deleted`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'order',
            metadata: {
              orderId: id,
              customerId: order.customerId,
              totalAmount: order.totalAmount,
              status: order.status,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
              deliveryDate: order.deliveryDate,
              collectionDate: order.collectionDate
            }
          });
        }

        playPositiveSound();
      } catch (error: any) {
        playNegativeSound();
        console.error('Error deleting order:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateOrderStatus: async (id, status, paymentMethod, paymentAmount, paymentNotes) => {
      try {
        set({ loading: true });
        const orderRef = doc(db, 'orders', id);
        const { getTotalPaidForOrder } = usePaymentStore.getState();
        const order = get().orders.find(o => o.id === id);
        
        if (!order) {
          throw new Error('Order not found');
        }

        // Check if order has any payments before allowing status change from quotation
        const totalPaid = getTotalPaidForOrder(id);
        if (totalPaid > 0 && status === 'quotation') {
          throw new Error('Cannot change status to quotation after payment has been made');
        }

        await updateDoc(orderRef, {
          status,
          updatedAt: Timestamp.now()
        });

        // Add payment if provided
        if (paymentMethod && paymentAmount) {
          const { addPayment } = usePaymentStore.getState();
          await addPayment({
            orderId: id,
            amount: paymentAmount,
            method: paymentMethod,
            notes: paymentNotes
          });
        }

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'status_change',
            message: `Order #${id} status changed from ${order.status} to ${status}`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'order',
            metadata: {
              orderId: id,
              oldStatus: order.status,
              newStatus: status,
              paymentMethod,
              paymentAmount,
              paymentNotes
            }
          });
        }

        playPositiveSound();
        set({ loading: false, error: null });
      } catch (error: any) {
        playNegativeSound();
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getOrderById: (id) => {
      return get().orders.find(order => order.id === id);
    },

    getPaymentStatus: (orderId: string) => {
      const { getTotalPaidForOrder } = usePaymentStore.getState();
      const order = get().orders.find(o => o.id === orderId);
      if (!order) return 'unpaid';

      const totalPaid = getTotalPaidForOrder(orderId);
      if (totalPaid === 0) return 'unpaid';
      if (totalPaid >= order.totalAmount) return 'paid';
      return 'partial';
    },

    getOrderStats: (timeRange, customStartDate = null, customEndDate = null) => {
      const { payments } = usePaymentStore.getState();
      const orders = get().orders;
      const { startDate, endDate } = customStartDate && customEndDate 
        ? { startDate: customStartDate, endDate: customEndDate }
        : getDateRange(timeRange);
      
      // Calculate previous period dates
      const periodDiff = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodDiff);
      const previousEndDate = new Date(startDate);

      // Get all payments for current period (including partial payments)
      const currentPeriodPayments = payments.filter(payment => 
        payment.date >= startDate && 
        payment.date <= endDate
      );

      // Get all payments for previous period
      const previousPeriodPayments = payments.filter(payment =>
        payment.date >= previousStartDate && 
        payment.date <= previousEndDate
      );

      // Get orders created in current period (for order count stats)
      const currentPeriodOrders = orders.filter(order => 
        order.createdAt >= startDate && 
        order.createdAt <= endDate
      );

      // Get orders created in previous period (for order count stats)
      const previousPeriodOrders = orders.filter(order =>
        order.createdAt >= previousStartDate && 
        order.createdAt <= previousEndDate
      );

      const totalOrders = currentPeriodOrders.length;
      const previousTotalOrders = previousPeriodOrders.length;

      const activeCustomers = new Set(currentPeriodOrders.map(o => o.customerId)).size;
      const previousActiveCustomers = new Set(previousPeriodOrders.map(o => o.customerId)).size;

      // Calculate revenue based on all payments received in the period
      const revenue = currentPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const previousRevenue = previousPeriodPayments.reduce((sum, payment) => sum + payment.amount, 0);

      const pendingOrders = currentPeriodOrders.filter(o => o.status === 'quotation').length;
      const previousPendingOrders = previousPeriodOrders.filter(o => o.status === 'quotation').length;
      const pendingRevenue = currentPeriodOrders
        .filter(o => o.status === 'quotation')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        totalOrders,
        activeCustomers,
        revenue,
        pendingOrders,
        pendingRevenue,
        orderChange: previousTotalOrders ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 : 0,
        customerChange: previousActiveCustomers ? ((activeCustomers - previousActiveCustomers) / previousActiveCustomers) * 100 : 0,
        revenueChange: previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0,
        pendingChange: previousPendingOrders ? ((pendingOrders - previousPendingOrders) / previousPendingOrders) * 100 : 0
      };
    },

    getOrderTrends: (timeRange, customStartDate = null, customEndDate = null) => {
      const { payments } = usePaymentStore.getState();
      const { startDate, endDate } = getDateRange(timeRange, customStartDate, customEndDate);

      // For today/yesterday, use hourly intervals
      if (timeRange === 'today' || timeRange === 'yesterday') {
        const trends: { [key: string]: { revenue: number; outstanding: number } } = {};
        
        // Initialize all hours with zero values
        for (let hour = 0; hour < 24; hour++) {
          const hourStr = hour.toString().padStart(2, '0') + ':00';
          trends[hourStr] = { revenue: 0, outstanding: 0 };
        }

        // Filter and process all payments within the date range
        const filteredPayments = payments.filter(payment => 
          payment.date >= startDate && 
          payment.date <= endDate
        );

        filteredPayments.forEach(payment => {
          const hour = payment.date.getHours();
          const hourStr = hour.toString().padStart(2, '0') + ':00';
          
          trends[hourStr].revenue += payment.amount;
        });

        // Convert to array format
        return Object.entries(trends).map(([hour, values]) => ({
          name: hour,
          revenue: values.revenue,
          outstanding: values.outstanding
        })).sort((a, b) => {
          const hourA = parseInt(a.name.split(':')[0]);
          const hourB = parseInt(b.name.split(':')[0]);
          return hourA - hourB;
        });
      }

      // For other ranges, use date-based logic
      const dates = getDatesInRange(startDate, endDate);
      const trends: { [key: string]: { revenue: number; outstanding: number } } = {};

      // Initialize all dates with zero values
      dates.forEach(date => {
        const key = formatDateForDisplay(date, timeRange);
        trends[key] = { revenue: 0, outstanding: 0 };
      });

      // Filter payments within the date range (include all payments)
      const filteredPayments = payments.filter(payment => 
        payment.date >= startDate && 
        payment.date <= endDate
      );

      // Calculate revenue based on payment dates
      filteredPayments.forEach(payment => {
        const dateKey = formatDateForDisplay(payment.date, timeRange);
        
        if (trends[dateKey]) {
          trends[dateKey].revenue += payment.amount;
        }
      });

      // Convert to array format for the chart
      return dates.map(date => {
        const key = formatDateForDisplay(date, timeRange);
        return {
          name: key,
          revenue: trends[key].revenue,
          outstanding: trends[key].outstanding
        };
      });
    }
  }))
);