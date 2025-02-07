import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useNotificationStore } from './notificationStore';
import { playPositiveSound } from '../utils/audio';
import type { Activity, ActivityType } from '../types';

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  initialize: () => (() => void);
  logActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => Promise<string>;
  getActivities: (filters?: {
    type?: ActivityType[];
    entityType?: 'order' | 'customer' | 'communication' | 'user';
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    userId?: string;
  }) => Promise<Activity[]>;
}

export const useActivityStore = create<ActivityState>(
  createProtectedStore((set, get) => ({
    activities: [],
    loading: false,
    error: null,

    initialize: () => {
      set({ loading: true });
      
      // Only fetch last 30 days of activities by default
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const q = query(
        collection(db, 'activities'),
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('createdAt', 'desc'),
        limit(1000) // Reasonable limit to prevent loading too much data
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const activities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          })) as Activity[];

          set({ activities, loading: false, error: null });
        },
        (error) => {
          console.error('Error fetching activities:', error);
          set({ error: error.message, loading: false });
        }
      );

      return unsubscribe;
    },

    logActivity: async (activity) => {
      try {
        set({ loading: true });

        // Validate required fields
        if (!activity.userId || !activity.userName || !activity.type || !activity.message) {
          throw new Error('Missing required activity fields');
        }

        // Clean up metadata by removing undefined values
        const cleanMetadata = activity.metadata ? 
          Object.fromEntries(
            Object.entries(activity.metadata)
              .filter(([_, value]) => value !== undefined)
              .map(([key, value]) => [key, value === null ? null : value])
          ) : null;

        // Add activity to Firestore
        const docRef = await addDoc(collection(db, 'activities'), {
          ...activity,
          metadata: cleanMetadata,
          createdAt: Timestamp.now()
        });

        // Play sound for activity creation
        playPositiveSound();

        // Add notification for certain activity types
        if (['order_created', 'payment', 'status_change'].includes(activity.type)) {
          const { addNotification } = useNotificationStore.getState();
          addNotification({
            message: activity.message,
            type: activity.type === 'payment' ? 'payment' : 
                  activity.type === 'order_created' ? 'order' : 'status'
          });
        }

        set({ loading: false, error: null });
        return docRef.id;
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to log activity';
        console.error('Error logging activity:', errorMessage);
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    },

    getActivities: async (filters = {}) => {
      try {
        set({ loading: true });
        
        let q = query(collection(db, 'activities'));
        
        // Apply filters
        if (filters.type) {
          q = query(q, where('type', 'in', filters.type));
        }
        
        if (filters.entityType) {
          q = query(q, where('entityType', '==', filters.entityType));
        }
        
        if (filters.startDate) {
          q = query(q, where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
        }
        
        if (filters.endDate) {
          q = query(q, where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
        }

        if (filters.userId) {
          q = query(q, where('userId', '==', filters.userId));
        }
        
        // Always order by createdAt desc
        q = query(q, orderBy('createdAt', 'desc'));
        
        if (filters.limit) {
          q = query(q, limit(filters.limit));
        }

        const snapshot = await getDocs(q);
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Activity[];

        set({ loading: false, error: null });
        return activities;
      } catch (error: any) {
        console.error('Error fetching activities:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    }
  }))
);