import { collection, doc, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function initializePaymentsCollection() {
  try {
    // Create system document in payments collection
    await setDoc(doc(db, 'payments', 'system'), {
      initialized: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }, { merge: true });

    console.log('Payments collection initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing payments collection:', error);
    throw error;
  }
}

export async function initializeCollections() {
  try {
    await initializePaymentsCollection();
    console.log('All collections initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
}