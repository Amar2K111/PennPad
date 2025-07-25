'use client'

import { useState } from 'react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}

export default function PaywallModal({ isOpen, onClose, onUpgrade }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleUpgrade = async () => {
    setIsLoading(true)
    // TODO: Implement payment processing
    setTimeout(() => {
      setIsLoading(false)
      onUpgrade()
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upgrade to PennPad Premium</h2>
            <p className="text-gray-600 mt-1">Unlock unlimited writing potential</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              $9.99
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
            <p className="text-gray-600">Cancel anytime • 7-day free trial</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What's included:</h3>
            <div className="grid gap-3">
              {[
                'Unlimited documents',
                'Advanced AI writing assistance',
                'Premium grammar checking',
                'All fonts and styling options',
                'Real-time collaboration',
                'Advanced analytics',
                'Priority support',
                'Export to all formats',
                'Custom themes',
                'Cloud backup'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckIcon className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Start Free Trial'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              By upgrading, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your subscription will automatically renew unless cancelled.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 