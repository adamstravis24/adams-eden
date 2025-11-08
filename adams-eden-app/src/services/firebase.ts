import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';
import { requireEnv } from '../utils/env';

const firebaseConfig = {
  apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

function validateFirebaseConfig(cfg: typeof firebaseConfig) {
  const missing: string[] = [];
  Object.entries(cfg).forEach(([k, v]) => {
    if (!v || v.trim() === '') missing.push(k);
  });
  if (missing.length) {
    throw new Error(`[firebase] Missing required config keys: ${missing.join(', ')}. Ensure EXPO_PUBLIC_* values are set as EAS build secrets or env in eas.json.`);
  }
  if (__DEV__) {
    // Help verify we didn't accidentally bundle empty values
    console.log('[firebase] Config OK', { projectId: cfg.projectId, apiKeyPreview: cfg.apiKey.slice(0, 12) + '…' });
  }
}

validateFirebaseConfig(firebaseConfig);

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Ensure persisted auth state on React Native via AsyncStorage
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    db = getFirestore(app);
  } else {
    app = getApp();
    // If Auth wasn't initialized yet (e.g., by a different module), getAuth() will initialize with default
    // persistence which is not suitable for RN. Ensure we've initialized once with RN persistence.
    try {
      auth = getAuth(app);
    } catch {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
    db = getFirestore(app);
  }
} catch (e) {
  // Fail fast with clearer context than a downstream JniException
  console.error('[firebase] Initialization failed:', e);
  throw e; // rethrow so error boundary / global handler sees it
}

export { app, auth, db };
