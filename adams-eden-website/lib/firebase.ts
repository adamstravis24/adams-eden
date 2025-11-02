import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

if (typeof window !== 'undefined') {
  (window as typeof window & { __plantbookAuth?: ReturnType<typeof getAuth> }).__plantbookAuth = auth;
}

// Limit persistence so a full browser close requires signing in again.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserSessionPersistence).catch((error) => {
    console.error('Failed to enforce session-only auth persistence:', error);
  });
}
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
