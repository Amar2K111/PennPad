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
      return NextResponse.json({ error: 'Chapter ID and Document ID are required' }, { status: 400 });
    }

    const chapterRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('chapters')
      .doc(id);
    
    const chapterSnap = await chapterRef.get();
    if (!chapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    return NextResponse.json({ id: chapterSnap.id, ...chapterSnap.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
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
      return NextResponse.json({ error: 'Chapter ID and Document ID are required' }, { status: 400 });
    }

    const chapterRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('chapters')
      .doc(id);
    
    const updateData: any = { updatedAt: new Date() };
    if (typeof title === 'string') updateData.title = title;
    if (typeof content === 'string') updateData.content = content;
    if (typeof order === 'number') updateData.order = order;
    
    await chapterRef.update(updateData);
    const updatedChapter = await chapterRef.get();
    
    return NextResponse.json({ id: updatedChapter.id, ...updatedChapter.data() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
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
      return NextResponse.json({ error: 'Chapter ID and Document ID are required' }, { status: 400 });
    }

    const chapterRef = db
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('chapters')
      .doc(id);
    
    const chapterSnap = await chapterRef.get();
    if (!chapterSnap.exists) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    await chapterRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
} 