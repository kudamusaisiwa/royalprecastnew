import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';

export async function initializeSampleData() {
  try {
    // Create admin user if it doesn't exist
    try {
      const adminCredential = await createUserWithEmailAndPassword(
        auth,
        'admin@example.com',
        'Admin@123'
      );

      await setDoc(doc(db, 'users', adminCredential.user.uid), {
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '+263712345678',
        role: 'admin',
        active: true,
        lastLogin: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('Admin user created successfully');
    } catch (error: any) {
      if (error.code !== 'auth/email-already-in-use') {
        throw error;
      }
    }

    // Create sample customers
    const customersRef = collection(db, 'customers');
    
    const sampleCustomers = [
      {
        firstName: 'John',
        lastName: 'Masimba',
        companyName: 'Masimba Holdings',
        email: 'john.masimba@masimbaholdings.co.zw',
        phone: '+263712345678',
        address: '123 Samora Machel Ave, Harare',
        notes: 'Premium client',
        rating: 5,
        totalOrders: 1,
        totalRevenue: 2500,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // Add sample customers
    for (const customer of sampleCustomers) {
      await setDoc(doc(customersRef), customer);
    }

    console.log('Sample data initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}