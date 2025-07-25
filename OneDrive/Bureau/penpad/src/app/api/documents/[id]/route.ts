import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\n/g, '\n'),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(adminConfig),
  });
}

const auth = getAuth();
const db = getFirestore();

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { id } = await context.params;
    const { title, content, isDeleted } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(decoded.uid).collection('documents').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    const updateData: any = { updatedAt: new Date() };
    if (typeof title === 'string') updateData.title = title;
    if (typeof content === 'string') updateData.content = content;
    if (typeof isDeleted === 'boolean') updateData.isDeleted = isDeleted;
    
    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    
    return NextResponse.json({ id: updatedDoc.id, ...updatedDoc.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(decoded.uid).collection('documents').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    return NextResponse.json({ id: docSnap.id, ...docSnap.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(decoded.uid).collection('documents').doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
} 