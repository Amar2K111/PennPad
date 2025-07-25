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
    
    // Process all batch operations
    const promises = [];
    
    // Save chapter content
    if (batchData.chapterContent) {
      const { chapterId, content, documentId } = batchData.chapterContent;
      promises.push(
        db.collection('users').doc(decoded.uid)
          .collection('documents').doc(documentId)
          .collection('chapters').doc(chapterId)
          .update({
            content,
            updatedAt: new Date(),
          })
      );
    }
    
    // Save note content
    if (batchData.noteContent) {
      const { noteId, content, documentId } = batchData.noteContent;
      promises.push(
        db.collection('users').doc(decoded.uid)
          .collection('documents').doc(documentId)
          .collection('notes').doc(noteId)
          .update({
            content,
            updatedAt: new Date(),
          })
      );
    }
    
    // Save document title
    if (batchData.documentTitle) {
      const { documentId, title } = batchData.documentTitle;
      promises.push(
        db.collection('users').doc(decoded.uid)
          .collection('documents').doc(documentId)
          .update({
            title,
            updatedAt: new Date(),
          })
      );
    }
    
    // Save analytics
    if (batchData.analytics) {
      promises.push(
        db.collection('users').doc(decoded.uid)
          .collection('analytics').doc('wordTracker')
          .set({
            ...batchData.analytics,
            updatedAt: new Date(),
          }, { merge: true })
      );
    }
    
    // Save spelling settings
    if (batchData.spelling) {
      promises.push(
        db.collection('users').doc(decoded.uid)
          .collection('settings').doc('spelling')
          .set({
            ...batchData.spelling,
            updatedAt: new Date(),
          }, { merge: true })
      );
    }
    
    // Execute all saves in parallel
    await Promise.all(promises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in batch save:', error);
    return NextResponse.json({ error: 'Failed to batch save' }, { status: 500 });
  }
} 