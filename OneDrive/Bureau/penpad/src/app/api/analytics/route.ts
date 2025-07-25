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
    const analyticsDoc = await db.collection('users').doc(decoded.uid).collection('analytics').doc('wordTracker').get();
    
    if (analyticsDoc.exists) {
      return NextResponse.json(analyticsDoc.data());
    } else {
      // Return default values if no analytics data exists
      return NextResponse.json({
        dailyCount: 0,
        dailyGoal: 0,
        wordGoal: 10000,
        dailyStartCount: 0,
        prevWordCount: 0,
        totalWordsWritten: 0,
        totalDaysActive: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
      });
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    const { dailyCount, dailyGoal, wordGoal, dailyStartCount, prevWordCount, totalWordsWritten, totalDaysActive, currentStreak, longestStreak, lastActiveDate, celebration } = await req.json();
    
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (typeof dailyCount === 'number') updateData.dailyCount = dailyCount;
    if (typeof dailyGoal === 'number') updateData.dailyGoal = dailyGoal;
    if (typeof wordGoal === 'number') updateData.wordGoal = wordGoal;
    if (typeof dailyStartCount === 'number') updateData.dailyStartCount = dailyStartCount;
    if (typeof prevWordCount === 'number') updateData.prevWordCount = prevWordCount;
    if (typeof totalWordsWritten === 'number') updateData.totalWordsWritten = totalWordsWritten;
    if (typeof totalDaysActive === 'number') updateData.totalDaysActive = totalDaysActive;
    if (typeof currentStreak === 'number') updateData.currentStreak = currentStreak;
    if (typeof longestStreak === 'number') updateData.longestStreak = longestStreak;
    if (lastActiveDate) updateData.lastActiveDate = lastActiveDate;
    if (typeof celebration === 'boolean') updateData.celebration = celebration;
    
    await db.collection('users').doc(decoded.uid).collection('analytics').doc('wordTracker').set(updateData, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating analytics:', error);
    return NextResponse.json({ error: 'Failed to update analytics' }, { status: 500 });
  }
} 