'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">PennPad</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin" className="text-gray-600 hover:text-gray-900">
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Write Your Book.{' '}
            <span className="text-blue-600">Share Your Story.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            PennPad gives aspiring authors the tools to plan, write, and finish their books—complete with AI writing assistance, advanced grammar checking, and distraction-free focus. Start your author journey today!
          </p>
          
          <div className="max-w-md mx-auto mb-12">
            <Link href="/auth/signup" className="w-full">
              <button
                type="button"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-lg font-semibold"
              >
                Get Started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Images Section */}
        <div className="grid md:grid-cols-2 gap-12 mt-20">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <img 
              src="/ai-features-screenshot.png" 
              alt="AI Features" 
              className="w-full h-auto rounded-lg"
            />
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <img 
              src="/daily-goals-screenshot.png" 
              alt="Daily Goals" 
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 