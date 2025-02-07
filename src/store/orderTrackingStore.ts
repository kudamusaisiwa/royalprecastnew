import { create } from 'zustand'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  doc, 
  getDoc,
  or,
  QueryConstraint 
} from 'firebase/firestore'
import type { Order as OrderType, OperationalStatus } from '@/types'

// Extend the base Order type to handle Firestore timestamps
interface Order extends Omit<OrderType, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface OrderProduct {
  productId: string
  name: string
  quantity: number
  specifications: string
  status: ProductionStatus
}

enum OrderStatus {
  ORDER_RECEIVED = 'order_received',
  IN_PRODUCTION = 'in_production',
  QUALITY_CHECK = 'quality_check',
  READY_FOR_DELIVERY = 'ready_for_delivery',
  DELIVERED = 'delivered'
}

enum ProductionStatus {
  PREPARING = 'preparing',
  MIXING = 'mixing',
  CASTING = 'casting',
  CURING = 'curing',
  QUALITY_INSPECTION = 'inspection',
  APPROVED = 'approved',
  PACKAGED = 'packaged'
}

interface OrderTrackingState {
  order: Order | null
  loading: boolean
  error: string | null
  recentTrackingNumbers: string[]
  
  // Actions
  trackOrder: (trackingNumber: string) => Promise<void>
  clearOrder: () => void
  addToRecentTrackingNumbers: (trackingNumber: string) => void
  clearRecentTrackingNumbers: () => void
}

export const useOrderTrackingStore = create<OrderTrackingState>((set, get) => ({
  order: null,
  loading: false,
  error: null,
  recentTrackingNumbers: [],

  trackOrder: async (trackingNumber: string) => {
    set({ loading: true, error: null })
    try {
      if (!trackingNumber) {
        throw new Error('Please enter a tracking number')
      }

      console.log('Searching for order with tracking number:', trackingNumber)
      const normalizedTrackingNumber = trackingNumber.toUpperCase().trim()
      let orderDoc = null
      let orderData = null

      // Step 1: Try to get the order directly by document ID (for Firebase IDs)
      try {
        const orderRef = doc(db, 'orders', normalizedTrackingNumber)
        const docSnap = await getDoc(orderRef)
        if (docSnap.exists()) {
          console.log('Found order by document ID')
          orderDoc = docSnap
          orderData = docSnap.data() as Order
        }
      } catch (error) {
        console.log('Error getting order by document ID:', error)
      }

      // Step 2: If not found, try searching across multiple fields
      if (!orderDoc) {
        const ordersRef = collection(db, 'orders')
        const conditions: QueryConstraint[] = [
          where('id', '==', normalizedTrackingNumber),
          where('trackingNumber', '==', normalizedTrackingNumber),
          where('orderNumber', '==', normalizedTrackingNumber),
          where('legacyId', '==', normalizedTrackingNumber),
          // Add support for the old Firebase ID format
          where('firebaseId', '==', normalizedTrackingNumber)
        ]

        // Search each field individually since Firestore doesn't support OR queries directly
        for (const condition of conditions) {
          if (orderDoc) break // Stop if we found the order

          const q = query(ordersRef, condition)
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            orderDoc = querySnapshot.docs[0]
            orderData = orderDoc.data() as Order
            console.log('Found order by field search:', condition)
            break
          }
        }
      }

      if (!orderDoc || !orderData) {
        throw new Error('Order not found. Please check your tracking number and try again.')
      }

      // Add to recent tracking numbers
      get().addToRecentTrackingNumbers(normalizedTrackingNumber)
      
      set({
        order: {
          id: orderDoc.id,
          ...orderData,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt || Timestamp.now()
        },
        loading: false,
      })
      
    } catch (error: any) {
      console.error('Error tracking order:', error)
      set({ 
        loading: false, 
        error: error.message 
      })
      throw error
    }
  },

  clearOrder: () => {
    set({ order: null })
  },

  addToRecentTrackingNumbers: (trackingNumber: string) => {
    set((state) => {
      const newRecentTrackingNumbers = [
        trackingNumber,
        ...state.recentTrackingNumbers.filter(n => n !== trackingNumber)
      ].slice(0, 5) // Keep only the 5 most recent numbers
      return { recentTrackingNumbers: newRecentTrackingNumbers }
    })
  },

  clearRecentTrackingNumbers: () => {
    set({ recentTrackingNumbers: [] })
  }
}))
