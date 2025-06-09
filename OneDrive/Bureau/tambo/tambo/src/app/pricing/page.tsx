'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PricingPage() {
  const [showPaywall, setShowPaywall] = useState(true)

  if (!showPaywall) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start your language learning journey today
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto">
          {/* Monthly Plan */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900">Monthly</h2>
              <p className="mt-4 text-gray-500">Perfect for short-term learning</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$19</span>
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <Link
                href="/onboarding"
                className="mt-8 block w-full bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700"
              >
                Get started
              </Link>
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900">Yearly</h2>
              <p className="mt-4 text-gray-500">Best value for long-term learning</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">$149</span>
                <span className="text-base font-medium text-gray-500">/year</span>
              </p>
              <Link
                href="/onboarding"
                className="mt-8 block w-full bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 