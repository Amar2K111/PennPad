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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    
    if (!id || !documentId) {
      return NextResponse.json({ error: 'Note ID and Document ID are required' }, { status: 400 });
    }

    const noteRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('notes')
      .doc(id);
    
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    return NextResponse.json({ id: noteSnap.id, ...noteSnap.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { id } = await context.params;
    const { documentId, title, content, order } = await req.json();
    
    if (!id || !documentId) {
      return NextResponse.json({ error: 'Note ID and Document ID are required' }, { status: 400 });
    }

    const noteRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('notes')
      .doc(id);
    
    const updateData: any = { updatedAt: new Date() };
    if (typeof title === 'string') updateData.title = title;
    if (typeof content === 'string') updateData.content = content;
    if (typeof order === 'number') updateData.order = order;
    
    await noteRef.update(updateData);
    const updatedNote = await noteRef.get();
    
    return NextResponse.json({ id: updatedNote.id, ...updatedNote.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
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
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    
    if (!id || !documentId) {
      return NextResponse.json({ error: 'Note ID and Document ID are required' }, { status: 400 });
    }

    const noteRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('notes')
      .doc(id);
    
    const noteSnap = await noteRef.get();
    if (!noteSnap.exists) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    await noteRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
} 