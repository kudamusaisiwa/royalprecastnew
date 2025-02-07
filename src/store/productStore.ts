import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  writeBatch,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { createProtectedStore } from './baseStore';
import { useActivityStore } from './activityStore';
import { useAuthStore } from './authStore';

export interface Product {
  id: string;
  name: string;
  category: string;
  minQuantity: number;
  basePrice: number;
  unit: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  initialize: () => Promise<(() => void) | undefined>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  importProducts: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

export const useProductStore = create<ProductState>(
  createProtectedStore((set, get) => ({
    products: [],
    loading: false,
    error: null,
    clearError: () => set({ error: null }),

    initialize: async () => {
      set({ loading: true });
      
      try {
        const q = query(
          collection(db, 'products'),
          orderBy('name')
        );

        const unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const products = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date()
            })) as Product[];

            set({ products, loading: false, error: null });
          },
          (error) => {
            console.error('Error fetching products:', error);
            set({ error: error.message, loading: false });
          }
        );

        return unsubscribe;
      } catch (error: any) {
        console.error('Error initializing products:', error);
        set({ error: error.message, loading: false });
        return undefined;
      }
    },

    addProduct: async (productData) => {
      try {
        set({ loading: true });
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        // Log activity
        await logActivity({
          type: 'product_created',
          message: `New product added: ${productData.name}`,
          userId: user.id,
          userName: user.name,
          entityId: docRef.id,
          entityType: 'product',
          metadata: {
            name: productData.name,
            category: productData.category,
            basePrice: productData.basePrice
          }
        });

        set({ loading: false, error: null });
        return docRef.id;
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    updateProduct: async (id, productData) => {
      try {
        set({ loading: true });
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        const currentProduct = get().products.find(p => p.id === id);

        if (!user) {
          throw new Error('User not authenticated');
        }

        if (!currentProduct) {
          throw new Error('Product not found');
        }

        const productRef = doc(db, 'products', id);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: Timestamp.now()
        });

        // Log activity
        await logActivity({
          type: 'product_updated',
          message: `Product updated: ${currentProduct.name}`,
          userId: user.id,
          userName: user.name,
          entityId: id,
          entityType: 'product',
          metadata: {
            previousData: {
              name: currentProduct.name,
              category: currentProduct.category,
              basePrice: currentProduct.basePrice
            },
            updatedData: productData
          }
        });

        set({ loading: false, error: null });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    deleteProduct: async (id) => {
      try {
        set({ loading: true });
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();
        const product = get().products.find(p => p.id === id);

        if (!user) {
          throw new Error('User not authenticated');
        }

        if (!product) {
          throw new Error('Product not found');
        }

        await deleteDoc(doc(db, 'products', id));

        // Log activity
        await logActivity({
          type: 'product_deleted',
          message: `Product deleted: ${product.name}`,
          userId: user.id,
          userName: user.name,
          entityId: id,
          entityType: 'product',
          metadata: {
            deletedProduct: {
              name: product.name,
              category: product.category,
              basePrice: product.basePrice
            }
          }
        });

        set({ loading: false, error: null });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    },

    importProducts: async (products) => {
      try {
        set({ loading: true });
        const { user } = useAuthStore.getState();
        const { logActivity } = useActivityStore.getState();

        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Process products in chunks to stay within Firestore limits
        const chunkSize = 500;
        for (let i = 0; i < products.length; i += chunkSize) {
          const chunk = products.slice(i, i + chunkSize);
          const batch = writeBatch(db);

          // For each product in the chunk
          for (const product of chunk) {
            // Check if product with same name exists
            const q = query(
              collection(db, 'products'),
              where('name', '==', product.name)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              // Update existing product
              const existingProduct = querySnapshot.docs[0];
              batch.update(doc(db, 'products', existingProduct.id), {
                ...product,
                updatedAt: Timestamp.now()
              });
            } else {
              // Create new product
              const newProductRef = doc(collection(db, 'products'));
              batch.set(newProductRef, {
                ...product,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              });
            }
          }

          await batch.commit();

          // Log activity for the chunk
          await logActivity({
            type: 'products_imported',
            message: `Imported ${chunk.length} products`,
            userId: user.id,
            userName: user.name,
            entityType: 'product',
            metadata: {
              count: chunk.length,
              batchNumber: Math.floor(i / chunkSize) + 1,
              totalBatches: Math.ceil(products.length / chunkSize)
            }
          });
        }

        set({ loading: false, error: null });
      } catch (error: any) {
        set({ error: error.message, loading: false });
        throw error;
      }
    }
  }))
);