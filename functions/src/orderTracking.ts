import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK
admin.initializeApp();

interface Order {
  id: string
  trackingNumber: string
  customerName: string
  phoneNumber: string
  email?: string
  deliveryAddress: string
  products: OrderProduct[]
  status: string
  productionProgress: number
  expectedDeliveryDate: admin.firestore.Timestamp
  totalAmount: number
  amountPaid: number
  balance: number
  lastUpdated: admin.firestore.Timestamp
}

interface OrderProduct {
  productId: string
  name: string
  quantity: number
  specifications: string
  status: string
}

// Function to sync order data to public tracking
export const syncOrderToPublicTracking = functions.firestore
  .document('orders/{orderId}')
  .onWrite(async (change, context) => {
    const orderData = change.after.exists ? change.after.data() as Order : null;
    const orderId = context.params.orderId;
    const publicTrackingRef = admin.firestore()
      .collection('public_order_tracking')
      .doc(orderId);

    // If order is deleted, remove from public tracking
    if (!orderData) {
      await publicTrackingRef.delete();
      return;
    }

    // Create public version of order data
    const publicOrderData = {
      trackingNumber: orderData.trackingNumber,
      customerName: orderData.customerName,
      status: orderData.status,
      productionProgress: orderData.productionProgress,
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      products: orderData.products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        specifications: product.specifications,
        status: product.status
      })),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update public tracking document
    await publicTrackingRef.set(publicOrderData, { merge: true });
  });
