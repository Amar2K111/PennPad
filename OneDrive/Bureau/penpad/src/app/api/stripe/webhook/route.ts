import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase-admin/firestore';

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

const adminDb = getFirestore();

export async function POST(req: Request) {
  // console.log('=== WEBHOOK CALLED ===');
  // console.log('Time:', new Date().toISOString());
  // console.log('Headers:', Object.fromEntries(req.headers.entries()));

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // console.log('Webhook received:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      return NextResponse.json({ error: 'No customer email found' }, { status: 400 });
    }

    // console.log('Checkout completed for email:', customerEmail);
    // console.log('Session data:', JSON.stringify(session, null, 2));

    try {
      // console.log('Searching for user with email:', customerEmail);
      const usersRef = collection(adminDb, 'users');
      const q = query(usersRef, where('email', '==', customerEmail));
      const querySnapshot = await getDocs(q);

      // console.log('Query result - found documents:', querySnapshot.size);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        // console.log('Found user document:', userDoc.id);
        // console.log('User data:', userDoc.data());

        await updateDoc(userDoc.ref, {
          isPremium: true,
          stripeCustomerId: session.customer,
          updatedAt: serverTimestamp(),
        });

        // console.log('User updated to isPremium: true and stripeCustomerId:', session.customer);
      } else {
        // console.log('Available users in database:');
        const allUsers = await getDocs(usersRef);
        allUsers.forEach(doc => {
          // console.log('User:', doc.data());
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  } else {
    // console.log('Event type not checkout.session.completed:', event.type);
  }

  return NextResponse.json({ received: true });
} 