import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(adminConfig),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const userRecord = await auth.getUser(decoded.uid);
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    return NextResponse.json({
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || userData?.displayName || '',
        photoURL: userRecord.photoURL || userData?.photoURL || '',
        emailVerified: userRecord.emailVerified,
        ...userData,
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { displayName } = await req.json();
    if (typeof displayName !== 'string' || !displayName.trim()) {
      return NextResponse.json({ error: 'Invalid displayName' }, { status: 400 });
    }
    // Update in Firebase Auth
    await auth.updateUser(decoded.uid, { displayName });
    // Update in Firestore (merge)
    await db.collection('users').doc(decoded.uid).set({ displayName }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update displayName' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    // Delete from Firestore
    await db.collection('users').doc(decoded.uid).delete();
    // Delete from Firebase Auth
    await auth.deleteUser(decoded.uid);
    // Clear session cookie (handled client-side)
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
} 