import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface BuildInfo {
  buildNumber: number;
  version: string;
  timestamp: Date;
  environment: string;
}

export async function getNextBuildNumber(): Promise<number> {
  const buildRef = doc(db, 'system', 'buildInfo');
  
  try {
    const buildDoc = await getDoc(buildRef);
    
    if (!buildDoc.exists()) {
      // Initialize build info if it doesn't exist
      await setDoc(buildRef, {
        buildNumber: 1,
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development'
      });
      return 1;
    }

    // Increment build number
    await setDoc(buildRef, {
      buildNumber: increment(1),
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    }, { merge: true });

    return (buildDoc.data().buildNumber || 0) + 1;
  } catch (error) {
    console.error('Error managing build number:', error);
    // Fallback to package.json build number if Firebase fails
    return parseInt(process.env.npm_package_buildNumber || '1', 10);
  }
}