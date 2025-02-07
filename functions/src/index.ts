import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { onUserCreated, onUserUpdated } from './auth';

// Initialize admin SDK
admin.initializeApp();

export const createTestData = functions.https.onRequest(async (request, response) => {
  try {
    // Create a test tracking document
    await admin.firestore().collection('public_order_tracking').doc('test1').set({
      trackingNumber: 'RP-20240118-0001',
      customerName: 'Test Customer',
      status: 'IN_PRODUCTION',
      productionProgress: 45,
      expectedDeliveryDate: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      ),
      products: [
        {
          name: 'Concrete Block',
          quantity: 100,
          specifications: '15cm x 20cm x 40cm',
          status: 'CASTING'
        }
      ],
      lastUpdated: admin.firestore.Timestamp.now()
    });

    response.json({ success: true, message: 'Test data created successfully' });
  } catch (error: any) {
    console.error('Error creating test data:', error);
    response.status(500).json({ success: false, error: error?.message || 'Unknown error occurred' });
  }
});

export {
  onUserCreated,
  onUserUpdated
};
