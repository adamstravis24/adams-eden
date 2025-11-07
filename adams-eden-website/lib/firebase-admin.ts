import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// This is used for server-side operations like updating user data from webhooks
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

let adminApp: admin.app.App | null = null;
let adminDb: admin.database.Database | null = null;

if (serviceAccount && !admin.apps.length) {
  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    adminDb = adminApp.database();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

export { adminApp, adminDb };
export default admin;
