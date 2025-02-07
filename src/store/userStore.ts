import { create } from 'zustand';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';
import type { User } from '../types';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  initialize: () => Promise<(() => void) | undefined>;
  updateUser: (id: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
}

export const useUserStore = create<UserState>(
  createProtectedStore((set, get) => ({
    users: [],
    loading: false,
    error: null,

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('name')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const users = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              lastLogin: doc.data().lastLogin ? doc.data().lastLogin.toDate() : null
            })) as User[];

            set({ users, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching users:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing users:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    updateUser: async (id, userData) => {
      try {
        set({ loading: true });

        // Get current user for permission check
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Not authenticated');
        }

        // Check if current user is admin for role changes
        if (userData.role) {
          const adminDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
            throw new Error('Only admins can change user roles');
          }
        }

        // Update auth user if needed
        const { updateUser: updateAuthUser } = useAuthStore.getState();
        await updateAuthUser(id, userData);

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'user_updated',
            message: `User ${userData.name || id} updated`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'user',
            metadata: {
              updatedFields: Object.keys(userData)
            }
          });
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteUser: async (id) => {
      try {
        set({ loading: true });
        const userToDelete = get().users.find(u => u.id === id);
        
        if (!userToDelete) {
          throw new Error('User not found');
        }

        // Check if trying to delete the last admin
        const adminUsers = get().users.filter(u => u.role === 'admin');
        if (userToDelete.role === 'admin' && adminUsers.length <= 1) {
          throw new Error('Cannot delete the last admin user');
        }

        // Delete user from both Auth and Firestore
        const { deleteUser: deleteAuthUser } = useAuthStore.getState();
        await deleteAuthUser(id);

        // Log activity
        const { logActivity } = useActivityStore.getState();
        const { user } = useAuthStore.getState();
        
        if (user) {
          await logActivity({
            type: 'user_deleted',
            message: `User ${userToDelete.name} deleted`,
            userId: user.id,
            userName: user.name,
            entityId: id,
            entityType: 'user',
            metadata: {
              deletedUser: {
                name: userToDelete.name,
                email: userToDelete.email,
                role: userToDelete.role
              }
            }
          });
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    getUserById: (id) => {
      return get().users.find(user => user.id === id);
    }
  }))
);