import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

interface Order {
  id: string
  referenceNumber: string
  customerName: string
  phoneNumber: string
  email?: string
  deliveryAddress: string
  products: OrderProduct[]
  status: OrderStatus
  productionProgress: number
  expectedDeliveryDate: Date
  totalAmount: number
  amountPaid: number
  balance: number
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

interface CustomerPortalState {
  order: Order | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  
  // Actions
  login: (orderReference: string) => Promise<void>
  logout: () => void
  setOrder: (order: Order | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useCustomerPortalStore = create<CustomerPortalState>()(
  persist(
    (set) => ({
      order: null,
      loading: false,
      error: null,
      isAuthenticated: false,

      login: async (orderReference: string) => {
        set({ loading: true, error: null })
        try {
          const normalizedRef = orderReference.toUpperCase()
          
          // Query Firestore for the order
          const ordersRef = collection(db, 'orders')
          const q = query(ordersRef, where('referenceNumber', '==', normalizedRef))
          const querySnapshot = await getDocs(q)
          
          if (querySnapshot.empty) {
            throw new Error('Order not found')
          }

          const orderDoc = querySnapshot.docs[0]
          const orderData = orderDoc.data() as Order
          
          set({
            isAuthenticated: true,
            order: {
              id: orderDoc.id,
              ...orderData
            },
            loading: false,
          })
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Authentication failed',
            loading: false,
          })
          throw error
        }
      },

      logout: () => {
        set({
          order: null,
          isAuthenticated: false,
          error: null,
        })
      },

      setOrder: (order) => set({ order }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'customer-portal-storage',
    }
  )
)
