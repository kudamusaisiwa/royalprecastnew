"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserUpdated = exports.onUserCreated = exports.createTestData = void 0;
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const auth_1 = require("./auth");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return auth_1.onUserCreated; } });
Object.defineProperty(exports, "onUserUpdated", { enumerable: true, get: function () { return auth_1.onUserUpdated; } });
// Initialize admin SDK
admin.initializeApp();
exports.createTestData = functions.https.onRequest(async (request, response) => {
    try {
        // Create a test tracking document
        await admin.firestore().collection('public_order_tracking').doc('test1').set({
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
        response.json({ success: true, message: 'Test data created successfully' });
    }
    catch (error) {
        console.error('Error creating test data:', error);
        response.status(500).json({ success: false, error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error occurred' });
    }
});
//# sourceMappingURL=index.js.map