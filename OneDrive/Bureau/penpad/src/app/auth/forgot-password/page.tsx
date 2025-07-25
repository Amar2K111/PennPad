'use client'

import Link from 'next/link'
import { useState } from "react";
import { auth } from "@/app/client-lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Please check your inbox.");
      setEmail("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Reset Your Password</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-600 text-sm">{success}</div>
          </div>
        )}
        
        <p className="text-gray-600 text-sm mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
              Sign In
            </Link>
          </p>
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 