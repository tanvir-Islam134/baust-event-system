/**
 * Firebase Web Client SDK - AUTH ONLY
 *
 * NOTE: Direct Firestore client SDK usage is strictly prohibited by security rules.
 * All application data reads and writes must pass through the Express REST API backend.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'dummy_api_key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baust-event-system.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baust-event-system',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baust-event-system.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef',
};

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export Auth instance and Google Auth Provider
export const auth = getAuth(app);

// Configure session-only persistence so sessions don't permanently linger across browser tabs
setPersistence(auth, browserSessionPersistence).catch(() => {});

export const googleAuthProvider = new GoogleAuthProvider();
// Force Google account chooser so user can select which Google account to sign in with
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

export default app;

