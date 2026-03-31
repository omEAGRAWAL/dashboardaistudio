import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

if (!getApps().length) {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    const serviceAccount = JSON.parse(Buffer.from(key, 'base64').toString('utf8'));
    initializeApp({ credential: cert(serviceAccount), projectId: firebaseConfig.projectId });
  } else {
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — Admin SDK running without credentials');
    initializeApp({ projectId: firebaseConfig.projectId });
  }
}

export const adminDb = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);

import { getAuth } from 'firebase-admin/auth';
export const adminAuth = getAuth();
