import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc,
  query,
  where,
  Timestamp,
  getDocs,
  doc,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useOrderStore } from './orderStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import { createProtectedStore } from './baseStore';
import type { DeliverySchedule } from '../types';

export interface DeliveryState {
  schedules: DeliverySchedule[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  addDeliverySchedule: (schedule: Omit<DeliverySchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDeliveryStatus: (orderId: string, type: 'delivery' | 'collection', status: 'pending' | 'completed' | 'cancelled') => Promise<void>;
  getSchedulesByOrder: (orderId: string) => DeliverySchedule[];
  getSchedulesByDateRange: (startDate: Date, endDate: Date) => Promise<DeliverySchedule[]>;
}

export const useDeliveryStore = create<DeliveryState>(
  createProtectedStore((set, get) => ({
    schedules: [],
    loading: false,
    error: null,

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'deliverySchedules'),
          orderBy('scheduledDate', 'asc')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const schedules = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              scheduledDate: doc.data().scheduledDate.toDate(),
              createdAt: doc.data().createdAt.toDate(),
              updatedAt: doc.data().updatedAt.toDate()
            })) as DeliverySchedule[];

            set({ schedules, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching delivery schedules:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error setting up delivery schedules listener:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addDeliverySchedule: async (scheduleData) => {
      try {
        set({ loading: true });
        const docRef = await addDoc(collection(db, 'deliverySchedules'), {
          ...scheduleData,
          scheduledDate: Timestamp.fromDate(scheduleData.scheduledDate),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'order_updated',
            message: `New delivery scheduled for order #${scheduleData.orderId}`,
            userId: user.id,
            userName: user.name,
            entityId: docRef.id,
            entityType: 'order',
            metadata: {
              scheduledDate: scheduleData.scheduledDate,
              deliveryAddress: scheduleData.deliveryAddress,
              quantity: scheduleData.quantity
            }
          });
        }

        set({ loading: false, error: null });
        return docRef.id;
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateDeliveryStatus: async (orderId: string, type: 'delivery' | 'collection', status: 'pending' | 'completed' | 'cancelled') => {
      try {
        set({ loading: true });
        const { updateOrder } = useOrderStore.getState();
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();

        if (!user) {
          throw new Error('User not authenticated');
        }

        if (!user.id || !user.name) {
          console.error('Invalid user object:', user);
          throw new Error('User data is incomplete');
        }

        // Update order status
        await updateOrder(orderId, {
          [type === 'delivery' ? 'deliveryStatus' : 'collectionStatus']: status
        });

        const activityData = {
          type: 'order_updated' as const,
          message: `${type === 'delivery' ? 'Delivery' : 'Collection'} status updated to ${status} for order #${orderId}`,
          userId: user.id,
          userName: user.name,
          entityId: orderId,
          entityType: 'order' as const,
          metadata: {
            type,
            status,
            updatedAt: new Date()
          }
        };

        console.log('Activity data:', activityData); // Debug log

        // Log activity
        await logActivity(activityData);

        set({ loading: false, error: null });
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to update status';
        console.error('Error updating delivery status:', errorMessage);
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    },

    getSchedulesByOrder: (orderId: string) => {
      return get().schedules.filter(schedule => schedule.orderId === orderId);
    },

    getSchedulesByDateRange: async (startDate: Date, endDate: Date) => {
      try {
        const q = query(
          collection(db, 'deliverySchedules'),
          where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
          where('scheduledDate', '<=', Timestamp.fromDate(endDate)),
          orderBy('scheduledDate', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          scheduledDate: doc.data().scheduledDate.toDate(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as DeliverySchedule[];
      } catch (error: any) {
        console.error('Error fetching schedules by date range:', error);
        throw error;
      }
    }
  }))
);