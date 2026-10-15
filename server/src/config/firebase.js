import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let db = null;
let auth = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[Firebase Admin] Initialized with service account credentials');
  } else {
    // Provide a development fallback if credentials are not yet configured in .env
    console.warn(
      '[Firebase Admin] Notice: Firebase credentials are placeholder or unset in .env. Initializing in fallback mode.'
    );
    admin.initializeApp({
      projectId: projectId || 'baust-event-system',
    });
  }
}

try {
  db = admin.firestore();
  auth = admin.auth();
} catch (error) {
  console.warn('[Firebase Admin] Warning getting db/auth instances:', error.message);
}

export { db, auth, admin };
export default admin;

