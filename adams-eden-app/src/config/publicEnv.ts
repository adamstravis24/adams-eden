// Public, build-time environment variables. These are safe to ship in the client bundle.
// IMPORTANT: These must be defined during the EAS build (remote CI) via EAS secrets or build profile env.

export const EXPO_PUBLIC_FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY as string | undefined;
export const EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined;
export const EXPO_PUBLIC_FIREBASE_PROJECT_ID = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID as string | undefined;
export const EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET as string | undefined;
export const EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
export const EXPO_PUBLIC_FIREBASE_APP_ID = process.env.EXPO_PUBLIC_FIREBASE_APP_ID as string | undefined;

function assertNonEmpty(value: string | undefined, key: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`[env] ${key} is not defined at build time. Configure it as an EAS secret or in eas.json build.env.`);
  }
  return value;
}

export const FIREBASE_PUBLIC_CONFIG = {
  apiKey: assertNonEmpty(EXPO_PUBLIC_FIREBASE_API_KEY, 'EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: assertNonEmpty(EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: assertNonEmpty(EXPO_PUBLIC_FIREBASE_PROJECT_ID, 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: assertNonEmpty(EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: assertNonEmpty(EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: assertNonEmpty(EXPO_PUBLIC_FIREBASE_APP_ID, 'EXPO_PUBLIC_FIREBASE_APP_ID'),
} as const;
