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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    
    const settingsDoc = await db.collection('users').doc(decoded.uid).collection('settings').doc('spelling').get();
    
    if (settingsDoc.exists) {
      return NextResponse.json(settingsDoc.data());
    } else {
      // Return default values if no settings exist
      return NextResponse.json({
        personalDictionary: [],
        autocorrectMap: {},
        ignoredErrors: [],
      });
    }
  } catch (error) {
    console.error('Error fetching spelling settings:', error);
    return NextResponse.json({ error: 'Failed to fetch spelling settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { personalDictionary, autocorrectMap, ignoredErrors } = await req.json();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (Array.isArray(personalDictionary)) updateData.personalDictionary = personalDictionary;
    if (typeof autocorrectMap === 'object') updateData.autocorrectMap = autocorrectMap;
    if (Array.isArray(ignoredErrors)) updateData.ignoredErrors = ignoredErrors;
    
    await db.collection('users').doc(decoded.uid).collection('settings').doc('spelling').set(updateData, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating spelling settings:', error);
    return NextResponse.json({ error: 'Failed to update spelling settings' }, { status: 500 });
  }
} 