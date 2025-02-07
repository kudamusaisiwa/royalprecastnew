import { create } from 'zustand';
import { 
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  updateEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (userData: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
    active: boolean;
  }) => Promise<void>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>(
  createProtectedStore((set, get) => {
    console.log('Initializing auth store...');
    
    // Set up auth state observer
    if (auth) {
      console.log('Setting up auth state observer...');
      onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('Auth state changed:', { 
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
          isAuthenticated: !!firebaseUser 
        });
        
        set({ loading: true });
        
        if (firebaseUser) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = {
                id: firebaseUser.uid,
                ...userDoc.data()
              } as User;
              
              console.log('User data loaded:', userData);
              
              set({ 
                user: userData, 
                isAuthenticated: true, 
                loading: false,
                error: null
              });
            } else {
              console.error('User document not found');
              set({ 
                user: null, 
                isAuthenticated: false, 
                loading: false,
                error: 'User account not found' 
              });
              await firebaseSignOut(auth);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            set({ 
              user: null, 
              isAuthenticated: false, 
              loading: false,
              error: 'Error fetching user data' 
            });
            await firebaseSignOut(auth);
          }
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false,
            error: null
          });
        }
      });
    } else {
      console.error('Auth not initialized');
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: 'Authentication not initialized' 
      });
    }

    return {
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,

      clearError: () => set({ error: null }),

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          
          // Set persistence to LOCAL
          await setPersistence(auth, browserLocalPersistence);
          
          // Sign in
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Get user document
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // Update last login
            await updateDoc(doc(db, 'users', userCredential.user.uid), {
              lastLogin: Timestamp.now()
            });
            
            set({ 
              user: { ...userData, id: userCredential.user.uid }, 
              isAuthenticated: true,
              loading: false,
              error: null
            });
          } else {
            throw new Error('User account not found');
          }
        } catch (error: any) {
          let errorMessage = 'Failed to log in';
          
          switch (error.code) {
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address';
              break;
            case 'auth/user-disabled':
              errorMessage = 'This account has been disabled';
              break;
            case 'auth/user-not-found':
              errorMessage = 'No account found with this email';
              break;
            case 'auth/wrong-password':
              errorMessage = 'Incorrect password';
              break;
            default:
              errorMessage = error.message;
          }
          
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          set({ loading: true, error: null });
          await firebaseSignOut(auth);
          set({ 
            user: null, 
            isAuthenticated: false, 
            loading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            loading: false, 
            error: 'Failed to log out' 
          });
          throw error;
        }
      },

      createUser: async (userData) => {
        try {
          set({ loading: true, error: null });

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
          );

          await updateProfile(userCredential.user, {
            displayName: userData.name
          });

          await setDoc(doc(db, 'users', userCredential.user.uid), {
            id: userCredential.user.uid,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            active: userData.active,
            lastLogin: null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          set({ loading: false, error: null });
        } catch (error: any) {
          let errorMessage = 'Failed to create user';
          
          switch (error.code) {
            case 'auth/email-already-in-use':
              errorMessage = 'Email already in use';
              break;
            case 'auth/invalid-email':
              errorMessage = 'Invalid email address';
              break;
            case 'auth/operation-not-allowed':
              errorMessage = 'Email/password accounts are not enabled';
              break;
            case 'auth/weak-password':
              errorMessage = 'Password is too weak';
              break;
            default:
              errorMessage = error.message;
          }
          
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      updateUser: async (userId, userData) => {
        try {
          set({ loading: true, error: null });

          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            throw new Error('User not found');
          }

          await updateDoc(userRef, {
            ...userData,
            updatedAt: Timestamp.now()
          });

          if (get().user?.id === userId) {
            set((state) => ({
              user: state.user ? { ...state.user, ...userData } : null,
              loading: false,
              error: null
            }));
          }
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      deleteUser: async (userId) => {
        try {
          set({ loading: true, error: null });
          await deleteDoc(doc(db, 'users', userId));
          set({ loading: false, error: null });
        } catch (error: any) {
          set({ loading: false, error: error.message });
          throw error;
        }
      }
    };
  })
);