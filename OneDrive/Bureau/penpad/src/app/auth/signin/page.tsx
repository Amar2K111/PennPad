'use client'

import Link from 'next/link'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/app/client-lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { useUserStore } from '@/app/store/useUserStore'
import { db } from "@/app/client-lib/firebase";
import { getDoc, setDoc, doc } from "firebase/firestore";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setUser } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (!user.emailVerified) {
        setError("Please verify your email before signing in. Check your inbox for a verification link.");
        setIsLoading(false);
        return;
      }
      
      // Parallel operations for better performance
      const [idToken] = await Promise.all([
        user.getIdToken(),
        setDoc(doc(db, "users", user.uid), {
          email: user.email || '',
          displayName: user.displayName || user.email || '',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }, { merge: true })
      ]);
      
      // Update user store with temporary data (will be updated after checking Firestore)
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        isPremium: false, // Will be updated after checking Firestore
        createdAt: new Date(user.metadata.creationTime || Date.now()),
        lastLoginAt: new Date(),
      });

      // Set session cookie and check premium status in parallel
      const [sessionResponse, userDoc] = await Promise.all([
        fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }),
        getDoc(doc(db, 'users', user.uid))
      ]);

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const userData = userDoc.data();
      if (userData && userData.isPremium) {
        router.push('/dashboard');
      } else {
        router.push('/paywall');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Google accounts are typically pre-verified, but we can still check
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setError("Please verify your email before signing in. We've sent you a verification email.");
        setIsLoading(false);
        return;
      }
      
      // Parallel operations for better performance
      const [idToken] = await Promise.all([
        user.getIdToken(),
        setDoc(doc(db, "users", user.uid), {
          email: user.email || '',
          displayName: user.displayName || user.email || '',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }, { merge: true })
      ]);
      
      // Update user store with temporary data (will be updated after checking Firestore)
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        isPremium: false, // Will be updated after checking Firestore
        createdAt: new Date(user.metadata.creationTime || Date.now()),
        lastLoginAt: new Date(),
      });

      // Set session cookie and check premium status in parallel
      const [sessionResponse, userDoc] = await Promise.all([
        fetch('/api/sessionLogin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }),
        getDoc(doc(db, 'users', user.uid))
      ]);

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const userData = userDoc.data();
      if (userData && userData.isPremium) {
        router.push('/dashboard');
      } else {
        router.push('/paywall');
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setError("Verification email sent! Please check your inbox.");
      } else {
        setError("Please sign in first to resend verification email.");
      }
    } catch (err: any) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Sign In to PennPad</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm">{error}</div>
            {error.includes("verify your email") && (
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="mt-2 text-blue-600 hover:underline text-sm disabled:opacity-50"
              >
                Resend verification email
              </button>
            )}
          </div>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="text-right">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline text-sm">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="my-6 flex items-center justify-center">
          <span className="text-gray-400 text-sm">or</span>
        </div>
        <button 
          type="button" 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
        >
          <span className="h-5 w-5 inline-block align-middle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.09 1.53 7.5 2.81l5.62-5.62C33.09 3.13 28.91 1 24 1 14.61 1 6.44 7.61 3.34 16.09l6.91 5.36C12.09 15.09 17.61 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.15 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.5c-.54 2.91-2.18 5.38-4.68 7.06l7.19 5.59C43.91 37.09 46.15 31.36 46.15 24.5z"/>
                <path fill="#FBBC05" d="M10.25 28.45A14.98 14.98 0 0 1 9 24c0-1.55.25-3.05.7-4.45l-6.91-5.36A23.93 23.93 0 0 0 1 24c0 3.91.94 7.61 2.59 10.91l6.66-6.46z" opacity="0.85"/>
                <path fill="#EA4335" d="M24 46c6.48 0 11.91-2.14 15.81-5.84l-7.19-5.59C30.09 36.91 27.21 38 24 38c-6.39 0-11.91-6.09-13.75-13.09l-6.66 6.46C6.44 40.39 14.61 46 24 46z"/>
              </g>
            </svg>
          </span>
          Sign in with Google
        </button>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">Sign Up</Link>
        </p>
      </div>
    </div>
  )
} 