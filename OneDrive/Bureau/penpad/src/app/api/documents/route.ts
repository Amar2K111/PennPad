import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const docsSnap = await adminDb.collection('users').doc(decoded.uid).collection('documents').orderBy('createdAt', 'desc').get();
    const documents = docsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ documents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const { title, content } = await req.json();
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create the document
    const docRef = await adminDb.collection('users').doc(decoded.uid).collection('documents').add({
      title,
      content: content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create the first chapter automatically
    await docRef.collection('chapters').add({
      title: 'Chapter 1',
      content: content || '',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
} 