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

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const batchData = await req.json();
    
    // Use Firebase batch writes for better performance
    const batch = db.batch();
    const now = new Date();
    
    // Save chapter content
    if (batchData.chapterContent) {
      const { chapterId, content, documentId } = batchData.chapterContent;
      const chapterRef = db.collection('users').doc(decoded.uid)
        .collection('documents').doc(documentId)
        .collection('chapters').doc(chapterId);
      
      batch.update(chapterRef, {
        content,
        updatedAt: now,
      });
    }
    
    // Save note content
    if (batchData.noteContent) {
      const { noteId, content, documentId } = batchData.noteContent;
      const noteRef = db.collection('users').doc(decoded.uid)
        .collection('documents').doc(documentId)
        .collection('notes').doc(noteId);
      
      batch.update(noteRef, {
        content,
        updatedAt: now,
      });
    }
    
    // Save document title
    if (batchData.documentTitle) {
      const { documentId, title } = batchData.documentTitle;
      const documentRef = db.collection('users').doc(decoded.uid)
        .collection('documents').doc(documentId);
      
      batch.update(documentRef, {
        title,
        updatedAt: now,
      });
    }
    
    // Save analytics - only if significant data
    if (batchData.analytics && Object.keys(batchData.analytics).length > 0) {
      const analyticsRef = db.collection('users').doc(decoded.uid)
        .collection('analytics').doc('wordTracker');
      
      batch.set(analyticsRef, {
        ...batchData.analytics,
        updatedAt: now,
      }, { merge: true });
    }
    
    // Save spelling settings - only if significant data
    if (batchData.spelling && Object.keys(batchData.spelling).length > 0) {
      const spellingRef = db.collection('users').doc(decoded.uid)
        .collection('settings').doc('spelling');
      
      batch.set(spellingRef, {
        ...batchData.spelling,
        updatedAt: now,
      }, { merge: true });
    }
    
    // Execute all saves in a single batch operation
    await batch.commit();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in batch save:', error);
    return NextResponse.json({ error: 'Failed to batch save' }, { status: 500 });
  }
} 