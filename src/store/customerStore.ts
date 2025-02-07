import { create } from 'zustand';
import { 
  collection, 
  doc,
  addDoc,
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import type { Customer } from '../types';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  isInitialized: boolean;
  initialize: () => Promise<(() => void) | undefined>;
  addCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'totalOrders' | 'totalRevenue'>) => Promise<string>;
  updateCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
}

export const useCustomerStore = create<CustomerState>(
  createProtectedStore((set, get) => ({
    customers: [],
    loading: false,
    error: null,
    clearError: () => set({ error: null }),
    isInitialized: false,

    initialize: async () => {
      set({ loading: true, error: null });
      
      try {
        const q = query(
          collection(db, 'customers'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
          async (snapshot) => {
            try {
              // Get all orders to calculate customer stats
              const ordersSnapshot = await getDocs(collection(db, 'orders'));
              const orders = ordersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));

              const customers = snapshot.docs.map(doc => {
                const customerId = doc.id;
                const customerOrders = orders.filter(order => order.customerId === customerId);
                const totalOrders = customerOrders.length;
                const totalRevenue = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

                // Update customer document if stats are different
                if (doc.data().totalOrders !== totalOrders || doc.data().totalRevenue !== totalRevenue) {
                  updateDoc(doc.ref, {
                    totalOrders,
                    totalRevenue,
                    updatedAt: Timestamp.now()
                  });
                }

                return {
                  id: doc.id,
                  ...doc.data(),
                  totalOrders,
                  totalRevenue,
                  createdAt: doc.data().createdAt?.toDate() || new Date(),
                  updatedAt: doc.data().updatedAt?.toDate() || new Date()
                };
              }) as Customer[];

              set({ customers, loading: false, error: null, isInitialized: true });
            } catch (error: any) {
              console.error('Error processing customers:', error);
              set({ error: error.message, loading: false });
            }
          },
          (error) => {
            console.error('Error fetching customers:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error setting up customer listener:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addCustomer: async (customerData) => {
      try {
        set({ loading: true });
        
        const newCustomer = {
          ...customerData,
          rating: 0,
          totalOrders: 0,
          totalRevenue: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'customers'), newCustomer);

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'customer_created',
            message: `New customer added: ${customerData.firstName} ${customerData.lastName}${customerData.companyName ? ` (${customerData.companyName})` : ''}`,
            userId: user.id,
            userName: user.name,
            entityId: docRef.id,
            entityType: 'customer',
            metadata: {
              firstName: customerData.firstName,
              lastName: customerData.lastName,
              companyName: customerData.companyName,
              email: customerData.email
            }
          });
        }

        set({ loading: false, error: null });
        return docRef.id;
      } catch (error: any) {
        console.error('Error adding customer:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateCustomer: async (id, customerData) => {
      try {
        set({ loading: true });
        const customerRef = doc(db, 'customers', id);
        const updateData = {
          ...customerData,
          updatedAt: Timestamp.now()
        };
        
        await updateDoc(customerRef, updateData);

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        const currentCustomer = get().customers.find(c => c.id === id);
        
        if (user && currentCustomer) {
          await logActivity({
            type: 'customer_updated',
            message: `Customer updated: ${currentCustomer.firstName} ${currentCustomer.lastName}`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'customer',
            metadata: {
              previousData: {
                firstName: currentCustomer.firstName,
                lastName: currentCustomer.lastName,
                companyName: currentCustomer.companyName,
                email: currentCustomer.email
              },
              updatedData: customerData
            }
          });
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        console.error('Error updating customer:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteCustomer: async (id) => {
      try {
        set({ loading: true });
        const customer = get().customers.find(c => c.id === id);
        
        if (!customer) {
          throw new Error('Customer not found');
        }

        // Delete customer document from Firestore
        await deleteDoc(doc(db, 'customers', id));

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'customer_deleted',
            message: `Customer deleted: ${customer.firstName} ${customer.lastName}`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'customer',
            metadata: {
              deletedCustomer: {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                companyName: customer.companyName,
                email: customer.email,
                rating: customer.rating,
                totalOrders: customer.totalOrders,
                totalRevenue: customer.totalRevenue,
                createdAt: customer.createdAt,
                updatedAt: customer.updatedAt
              }
            }
          });
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getCustomerById: (id) => {
      return get().customers.find(customer => customer.id === id);
    }
  }))
);