"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Initialize admin SDK if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
async function createTestTrackingData() {
    try {
        // Create a test tracking document
        await db.collection('public_order_tracking').doc('test1').set({
            trackingNumber: 'RP-20240118-0001',
            customerName: 'Test Customer',
            status: 'IN_PRODUCTION',
            productionProgress: 45,
            expectedDeliveryDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
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
        console.log('Test tracking data created successfully');
    }
    catch (error) {
        console.error('Error creating test data:', error);
    }
}
// Run the function
createTestTrackingData()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=createTestData.js.map