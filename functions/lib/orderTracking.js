"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncOrderToPublicTracking = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Initialize admin SDK
admin.initializeApp();
// Function to sync order data to public tracking
exports.syncOrderToPublicTracking = functions.firestore
    .document('orders/{orderId}')
    .onWrite(async (change, context) => {
    const orderData = change.after.exists ? change.after.data() : null;
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
//# sourceMappingURL=orderTracking.js.map