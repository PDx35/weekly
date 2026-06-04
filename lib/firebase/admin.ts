/**
 * Firebase Admin SDK initialisation (SERVER ONLY).
 *
 * This module holds privileged credentials and bypasses Firestore security
 * rules. It must never be imported from a client component or any module that
 * ends up in the browser bundle. Reads only `FIREBASE_ADMIN_*` env vars.
 *
 * The `server-only` import makes the build fail loudly if this file is ever
 * pulled into a client bundle.
 */
import 'server-only';
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private keys are stored with escaped newlines in env vars; restore them.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, ' +
        'FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.',
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminApp: App = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
