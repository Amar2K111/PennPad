import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const chaptersSnap = await adminDb
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('chapters')
      .orderBy('order', 'asc')
      .get();
    
    const chapters = chaptersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ chapters });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { documentId, title, content, order } = await req.json();
    
    if (!documentId || !title) {
      return NextResponse.json({ error: 'Document ID and title are required' }, { status: 400 });
    }

    const chapterRef = await adminDb
      .collection('users')
      .doc(decoded.uid)
      .collection('documents')
      .doc(documentId)
      .collection('chapters')
      .add({
        title,
        content: content || '',
        order: order || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    
    return NextResponse.json({ id: chapterRef.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
} 