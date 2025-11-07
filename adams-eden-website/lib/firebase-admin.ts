import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton-safe for Next.js hot reloads)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App | null = null;
let adminDb: admin.database.Database | null = null;

try {
  if (admin.apps.length) {
    // Reuse existing app in dev/hot-reload/serverless
    adminApp = admin.app();
  } else if (serviceAccount) {
    // First-time initialization
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } else {
    console.error('Firebase Admin service account is missing.');
  }

  if (adminApp) {
    adminDb = adminApp.database();
  }
} catch (err) {
  console.error('Firebase Admin initialization error:', err);
}

export { adminApp, adminDb };
export default admin;
