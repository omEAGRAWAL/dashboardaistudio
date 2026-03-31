import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

if (!getApps().length) {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    // Production: service account key provided as base64-encoded JSON
    const serviceAccount = JSON.parse(Buffer.from(key, 'base64').toString('utf8'));
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Development fallback: initialize without credentials (only works with emulator or open rules)
    console.warn('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — Admin SDK running without credentials');
    initializeApp({ projectId: firebaseConfig.projectId });
  }
}

export const adminDb = getFirestore();

import { getAuth } from 'firebase-admin/auth';
export const adminAuth = getAuth();
