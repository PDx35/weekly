import { NextResponse } from 'next/server';
import { isAdminConfigured, getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const { email, password, name, secret } = await req.json();
    const isDev = process.env.NODE_ENV === 'development';

    if (!email || !password || !name || (!secret && !isDev)) {
      return NextResponse.json(
        { error: 'All fields are required (email, password, name, secret).' },
        { status: 400 }
      );
    }

    // 1. Verify administrative setup secret
    const systemSecret = process.env.ADMIN_SETUP_SECRET;
    if (!isDev) {
      if (!systemSecret) {
        return NextResponse.json(
          { error: 'ADMIN_SETUP_SECRET is not configured on the server. Please set it in .env.local first.' },
          { status: 500 }
        );
      }

      if (secret !== systemSecret) {
        return NextResponse.json(
          { error: 'Incorrect setup secret code.' },
          { status: 403 }
        );
      }
    } else {
      // In development mode, if a systemSecret is set, we still validate it if provided.
      if (systemSecret && secret && secret !== systemSecret) {
        return NextResponse.json(
          { error: 'Incorrect setup secret code.' },
          { status: 403 }
        );
      }
    }

    // 2. Verify Admin SDK configuration
    if (!isAdminConfigured()) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not fully configured in environment variables.' },
        { status: 500 }
      );
    }

    const auth = getAdminAuth();
    const db = getAdminDb();

    // 3. Check if user already exists or create them
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (err: unknown) {
      const errorObj = err as { code?: string };
      if (errorObj?.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
        });
      } else {
        throw err;
      }
    }

    const uid = userRecord.uid;

    // 4. Create or set the user document in 'users' collection
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        name,
        email,
        phone: '',
        photoUrl: null,
        addresses: [],
        defaultAddressId: '',
        createdAt: new Date(),
      });
    }

    // 5. Create or set the admin authorization in 'admins' collection
    await db.collection('admins').doc(uid).set({
      role: 'admin',
      email,
      assignedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created admin user: ${email}`,
      uid,
    });
  } catch (err: unknown) {
    console.error('Error setting up admin:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred during admin setup.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
