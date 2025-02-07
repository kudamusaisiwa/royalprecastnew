import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;

    try {
      // Set custom claims based on user role
      await admin.auth().setCustomUserClaims(userId, {
        role: userData.role
      });

      // Update the user document to indicate claims have been set
      await snap.ref.update({
        customClaimsSet: true
      });

      console.log(`Successfully set custom claims for user ${userId}`);
    } catch (error) {
      console.error(`Error setting custom claims for user ${userId}:`, error);
    }
  });

export const onUserUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const userId = context.params.userId;

    // Only update claims if role has changed
    if (newData.role !== previousData.role) {
      try {
        // Set custom claims based on new role
        await admin.auth().setCustomUserClaims(userId, {
          role: newData.role
        });

        // Update the user document to indicate claims have been set
        await change.after.ref.update({
          customClaimsSet: true
        });

        console.log(`Successfully updated custom claims for user ${userId}`);
      } catch (error) {
        console.error(`Error updating custom claims for user ${userId}:`, error);
      }
    }
  });
