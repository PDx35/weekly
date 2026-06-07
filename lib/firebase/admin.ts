/**
 * Firebase Admin SDK initialisation (SERVER ONLY).
 *
 * Holds privileged credentials and bypasses Firestore security rules. Never
 * import from a client component. Reads only `FIREBASE_ADMIN_*` env vars.
 *
 * Initialisation is lazy so the app (and route handlers) load even when no
 * service account is configured yet — callers should gate on
 * {@link isAdminConfigured} and return a graceful error if it's false.
 */
import 'server-only';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function readCreds() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private keys are stored with escaped newlines in env vars; restore them.
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    // Strip surrounding quotes if present
    privateKey = privateKey.replace(/^["']|["']$/g, '').trim();
    // Restore newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  return { projectId, clientEmail, privateKey };
}

/** Whether a service account is fully configured. */
export function isAdminConfigured(): boolean {
  const { projectId, clientEmail, privateKey } = readCreds();
  return Boolean(projectId && clientEmail && privateKey);
}

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length) {
    cachedApp = existing[0];
    return cachedApp;
  }
  const { projectId, clientEmail, privateKey } = readCreds();
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, ' +
        'FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local.',
    );
  }
  cachedApp = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return cachedApp;
}

/** Admin Auth (lazy). Throws if no service account is configured. */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Admin Firestore (lazy). Throws if no service account is configured. */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
