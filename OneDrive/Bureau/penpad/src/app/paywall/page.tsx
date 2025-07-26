"use client";

import { useEffect, useState } from 'react';
import { useUserStore } from '@/app/store/useUserStore';
import { auth } from '@/app/client-lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { loadStripe } from '@stripe/stripe-js';

export default function PaywallPage() {
  const { user, isAuthenticated, setUser } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      window.location.href = '/auth/signin';
    } catch (error) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email || '',
          createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
          isPremium: false,
          lastLoginAt: new Date(),
        });
        setReady(true);
      } else {
        setUser(null);
        window.location.href = '/auth/signin';
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  async function handleCheckout() {
    setLoading(true);
    const stripe = await stripePromise;
    const res = await fetch('/api/create-checkout-session', { method: 'POST' });
    const session = await res.json();
    await stripe?.redirectToCheckout({ sessionId: session.id });
    setLoading(false);
  }

  if (!isAuthenticated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PennPad Premium</h1>
          <p className="text-gray-600">Unlock your full writing potential</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8 w-full">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">AI Writing Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Unlimited Chapters & Scenes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Unlimited Notes</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Export to PDF & Word</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Word Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Advanced Analytics</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-700">Unlimited Documents</span>
          </div>
        </div>

        {/* Pricing and Button */}
        <div className="w-full flex flex-col items-center">
          <div className="text-4xl font-bold text-gray-900 mb-1">$10<span className="text-lg font-normal text-gray-600">/month</span></div>
          <p className="text-sm text-gray-500 mb-6">Cancel anytime</p>
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Get Premium'}
          </button>
          <button
            className="mt-2 text-sm text-gray-500 hover:text-blue-600 underline bg-transparent border-none shadow-none p-0"
            onClick={handleLogout}
            style={{ width: 'auto' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
} 