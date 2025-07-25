import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

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

export async function POST(req: NextRequest) {
  try {
    // 1. Get session cookie from request
    const sessionCookie = req.cookies.get('session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Verify session cookie
    let decodedClaims;
    try {
      decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userEmail = decodedClaims.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email in session' }, { status: 400 });
    }

    // 3. Create Stripe Checkout session with locked email
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      success_url: 'http://localhost:3000/paywall/success',
      cancel_url: 'http://localhost:3000/paywall',
    });
    return NextResponse.json({ id: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 