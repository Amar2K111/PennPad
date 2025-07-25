'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline'

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
            Write Better with{' '}
            <span className="text-blue-600">AI Assistance</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            PennPad combines powerful AI writing assistance, advanced grammar checking, 
            and real-time collaboration to help you create exceptional content.
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

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <SparklesIcon className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">AI Writing Assistant</h3>
            <p className="text-gray-600">
              Get intelligent suggestions for improving your writing style, 
              generating content, and enhancing clarity.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <CheckCircleIcon className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Grammar & Spell Check</h3>
            <p className="text-gray-600">
              Advanced grammar checking with support for multiple languages 
              and real-time error detection.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <UserGroupIcon className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Real-time Collaboration</h3>
            <p className="text-gray-600">
              Work together with your team in real-time, 
              with live editing and commenting features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 