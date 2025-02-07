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
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import type { Communication, CommunicationType } from '../types';

interface CommunicationState {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  addCommunication: (data: {
    customerId: string;
    type: CommunicationType;
    summary: string;
  }) => Promise<string>;
  getCustomerCommunications: (customerId: string) => Communication[];
}

export const useCommunicationStore = create<CommunicationState>(
  createProtectedStore((set, get) => ({
    communications: [],
    loading: false,
    error: null,

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'communications'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const communications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt.toDate()
            })) as Communication[];

            set({ communications, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching communications:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing communications:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addCommunication: async (data) => {
      if (!data.customerId) {
        throw new Error('Customer ID is required');
      }

      try {
        set({ loading: true });
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Add communication to Firestore
        const docRef = await addDoc(collection(db, 'communications'), {
          ...data,
          createdBy: user.id,
          createdAt: Timestamp.now()
        });

        // Log activity
        await logActivity({
          type: 'communication_added',
          message: `New ${data.type} communication added`,
          userId: user.id,
          userName: user.name,
          entityId: data.customerId,
          entityType: 'customer',
          metadata: {
            type: data.type,
            summary: data.summary
          }
        });

        set({ loading: false, error: null });
        return docRef.id;
      } catch (error: any) {
        console.error('Error adding communication:', error);
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getCustomerCommunications: (customerId: string) => {
      return get().communications.filter(comm => comm.customerId === customerId);
    }
  }))
);