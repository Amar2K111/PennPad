'use client'

import Link from 'next/link'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider, db } from "@/app/client-lib/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useUserStore } from '@/app/store/useUserStore'
import { getDoc, setDoc, doc } from "firebase/firestore";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Create or update user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: user.email || '',
        displayName: user.displayName || user.email || '',
        isPremium: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      }, { merge: true });
      // Update user store
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        createdAt: new Date(user.metadata.creationTime || Date.now()),
      })
      // Set session cookie
      const idToken = await user.getIdToken();
      await fetch('/api/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      // Fetch user doc from Firestore to get isPremium
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData && userData.isPremium) {
        router.push('/dashboard');
      } else {
        router.push('/paywall');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Create or update user document in Firestore (Google sign-up)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email || '',
        displayName: user.displayName || user.email || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      }, { merge: true });
      // Update user store
      setUser({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        createdAt: new Date(user.metadata.creationTime || Date.now()),
      })
      // Set session cookie
      const idToken = await user.getIdToken();
      await fetch('/api/sessionLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      // Fetch user doc from Firestore to get isPremium
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData && userData.isPremium) {
        router.push('/dashboard');
      } else {
        router.push('/paywall');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create your PennPad account</h2>
        {error && <div className="mb-4 text-red-600 text-center text-sm">{error}</div>}
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Sign Up
          </button>
        </form>
        <div className="my-6 flex items-center justify-center">
          <span className="text-gray-400 text-sm">or</span>
        </div>
        <button type="button" onClick={handleGoogleSignUp} className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
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
          Sign up with Google
        </button>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
} 