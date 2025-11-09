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
if (!__DEV__) {
  // Minimal production diagnostic (won't expose full key) helpful while tracking auth/invalid-api-key
  console.log('[firebase] config summary', {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    apiKeyPrefix: firebaseConfig.apiKey.slice(0, 8) + '…',
  });
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

let firebaseInitError: any = null;
let firebaseInitialized = false;
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
    try {
      auth = getAuth(app);
    } catch {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
    db = getFirestore(app);
  }
  firebaseInitialized = true;
} catch (e) {
  // Log the error but don't rethrow — export the failure so the app can render an error screen
  console.error('[firebase] Initialization failed:', e);
  firebaseInitError = e;
}

export { firebaseInitError, firebaseInitialized };

export { app, auth, db };
