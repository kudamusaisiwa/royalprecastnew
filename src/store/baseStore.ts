import { create } from 'zustand';
import { auth } from '../lib/firebase';

export const createProtectedStore = <T extends object>(
  storeFn: (set: any, get: any) => T
) => {
  return (set: any, get: any) => {
    const store = storeFn(set, get);
    
    const withErrorHandling = {
      ...store,
      error: null as string | null,
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      handleError: (error: any) => {
        console.error('Store error:', error);
        let errorMessage = 'An unexpected error occurred';
        
        if (error?.code === 'permission-denied') {
          // Don't show permission errors for unauthenticated users
          if (!auth.currentUser) {
            return null;
          }
          errorMessage = 'You do not have permission to perform this action';
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        set({ error: errorMessage });
        return errorMessage;
      }
    };

    // Add initialization state tracking
    const withInitState = {
      ...withErrorHandling,
      isInitialized: false,
      setInitialized: (value: boolean) => set({ isInitialized: value }),
    };

    // Wrap initialize method if it exists
    if ('initialize' in store) {
      const originalInit = store.initialize;
      withInitState.initialize = async () => {
        if (!auth.currentUser) {
          console.log('Skipping initialization - user not authenticated');
          return () => {};
        }

        try {
          const cleanup = await originalInit();
          set({ isInitialized: true, error: null });
          return cleanup;
        } catch (error) {
          // Don't show errors for permission denied when not authenticated
          if (error?.code === 'permission-denied' && !auth.currentUser) {
            return () => {};
          }
          withInitState.handleError(error);
          return () => {};
        }
      };
    }

    return withInitState;
  };
};