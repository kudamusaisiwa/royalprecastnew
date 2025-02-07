import { create } from 'zustand';
import { 
  collection, 
  addDoc,
  doc,
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import { useOrderStore } from './orderStore';
import { useTaskStore } from './taskStore';
import type { Payment, PaymentMethod } from '../types';

interface PaymentState {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  addPayment: (paymentData: Partial<Payment>) => Promise<string>;
  getPaymentsByOrder: (orderId: string) => Payment[];
  getTotalPaidForOrder: (orderId: string) => number;
}

export const usePaymentStore = create<PaymentState>(
  createProtectedStore((set, get) => ({
    payments: [],
    loading: false,
    error: null,

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'payments'),
          orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const payments = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                amount: typeof data.amount === 'number' ? Number(data.amount.toFixed(2)) : 0,
                date: data.date.toDate(),
                createdAt: data.createdAt.toDate()
              };
            }) as Payment[];

            set({ payments, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching payments:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing payments:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addPayment: async (paymentData: Partial<Payment>) => {
      try {
        const { user } = useAuthStore.getState();
        const { tasks, updateTask } = useTaskStore.getState();
        const { logActivity } = useActivityStore.getState();
        const { getOrderById, updateOrder } = useOrderStore.getState();
        
        if (!paymentData.date) {
          paymentData.date = new Date();
        }
        
        // Add payment
        const paymentRef = await addDoc(collection(db, 'payments'), {
          ...paymentData,
          createdBy: user?.id,
          createdAt: Timestamp.now(),
          date: Timestamp.fromDate(paymentData.date)
        });

        // Update order total paid amount
        const order = getOrderById(paymentData.orderId!);
        if (order) {
          const totalPaid = get().getTotalPaidForOrder(order.id) + (paymentData.amount || 0);
          const updates: any = {
            totalPaid,
            lastPaymentDate: Timestamp.fromDate(paymentData.date)
          };

          // Change status to 'production' as soon as any payment is made
          if (order.status === 'quotation') {
            updates.status = 'production';
          }

          await updateOrder(order.id, updates);
        }

        // Find and complete follow-up task for this order
        const followUpTask = tasks.find(task => 
          task.orderId === paymentData.orderId && 
          task.metadata?.type === 'follow_up' &&
          task.status !== 'completed'
        );

        if (followUpTask) {
          await updateTask(followUpTask.id, {
            status: 'completed',
            completedAt: new Date(),
            metadata: {
              ...followUpTask.metadata,
              completedReason: 'payment_received',
              paymentId: paymentRef.id
            }
          });
        }

        // Log activity with all required fields
        await logActivity({
          type: 'payment',
          userId: user!.id,
          userName: user!.displayName || user!.email || 'Unknown User',
          message: `Payment of $${paymentData.amount} received via ${paymentData.method} for Order #${order?.orderNumber || paymentData.orderId}`,
          entityId: paymentData.orderId!,
          entityType: 'order',
          metadata: {
            orderId: paymentData.orderId,
            amount: paymentData.amount,
            method: paymentData.method,
            paymentId: paymentRef.id,
            reference: paymentData.reference
          }
        });

        return paymentRef.id;
      } catch (error: any) {
        console.error('Error adding payment:', error);
        throw error;
      }
    },

    getPaymentsByOrder: (orderId: string) => {
      return get().payments
        .filter(payment => payment.orderId === orderId)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    },

    getTotalPaidForOrder: (orderId: string, startDate?: Date, endDate?: Date) => {
      let paymentsToSum = get().payments.filter(payment => payment.orderId === orderId);

      // Apply date range filter if provided
      if (startDate && endDate) {
        paymentsToSum = paymentsToSum.filter(payment => {
          const paymentDate = payment.date;
          return paymentDate >= startDate && paymentDate <= endDate;
        });
      }

      const total = paymentsToSum.reduce((total, payment) => {
        // Ensure we're working with valid numbers
        const amount = typeof payment.amount === 'number' ? payment.amount : parseFloat(payment.amount as any);
        if (isNaN(amount)) {
          console.error('Invalid payment amount:', payment);
          return total;
        }
        // Use toFixed(2) to handle floating point precision, then convert back to number
        return Number((total + amount).toFixed(2));
      }, 0);
      
      return Number(total.toFixed(2)); // Ensure final result has 2 decimal places
    }
  }))
);