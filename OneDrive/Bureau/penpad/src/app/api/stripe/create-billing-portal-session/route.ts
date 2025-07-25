import { NextRequest, NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from '@/app/lib/stripe';

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
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const stripeCustomerId = userData?.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer ID found.' }, { status: 400 });
    }
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: process.env.NEXT_PUBLIC_BASE_URL + '/settings',
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Billing portal session error:', error);
    return NextResponse.json({ error: 'Failed to create billing portal session.' }, { status: 500 });
  }
} 