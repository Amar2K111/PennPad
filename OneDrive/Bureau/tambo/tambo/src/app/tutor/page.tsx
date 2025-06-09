'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { auth } from '@/firebase'
import { signOut, onAuthStateChanged, User } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'

export default function TutorPage() {
  const [activeSection, setActiveSection] = useState('alphabet')
  const [showSettings, setShowSettings] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const [showPaywall, setShowPaywall] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        router.replace('/auth/signin')
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace('/auth/signin')
  }

  const handleClosePaywall = () => {
    setShowPaywall(false);
  }

  const sidebarItems = [
    { id: 'alphabet', label: 'Alphabet Learning' },
    { id: 'everyday', label: 'Everyday Vocabulary' },
    { id: 'scenarios', label: 'Scenario Vocabulary' },
  ]

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-2xl py-12 px-6 w-full max-w-3xl mx-auto min-h-[600px] flex flex-col items-center">
            {/* Close (cross) button */}
            <button
              className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 text-3xl font-bold focus:outline-none"
              onClick={handleClosePaywall}
              aria-label="Close paywall"
            >
              &times;
            </button>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center w-full">Start your subscription</h2>
            <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center items-stretch">
              {/* Monthly Plan */}
              <div className="flex-1 border border-blue-500 rounded-xl shadow-lg bg-white flex flex-col p-6 items-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1">Monthly</h3>
                <p className="text-gray-500 mb-4 text-sm">Pay as you go</p>
                <p className="text-4xl font-extrabold text-blue-600 mb-1">$10 <span className="text-lg font-medium text-gray-500">/month</span></p>
                <ul className="text-left text-gray-700 mb-6 space-y-2 text-base w-full max-w-xs mx-auto">
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Unlimited access to all features</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Advanced AI tutor</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Priority support</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Cancel anytime</li>
                </ul>
                <button className="w-full bg-blue-600 text-white font-bold py-3 text-base rounded-lg hover:bg-blue-700 transition">Subscribe now</button>
              </div>
              {/* Yearly Plan */}
              <div className="flex-1 border border-blue-500 rounded-xl shadow-lg bg-white flex flex-col p-6 items-center relative">
                {/* Savings label */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-xs font-bold shadow">Save 17% with yearly plan</div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Yearly</h3>
                <p className="text-gray-500 mb-4 text-sm">Best value for serious learners</p>
                <p className="text-4xl font-extrabold text-blue-600 mb-1">$100 <span className="text-lg font-medium text-gray-500">/year</span></p>
                <ul className="text-left text-gray-700 mb-6 space-y-2 text-base w-full max-w-xs mx-auto">
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Unlimited access to all features</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Advanced AI tutor</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Priority support</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2 text-lg">✓</span> Cancel anytime</li>
                </ul>
                <button className="w-full bg-blue-600 text-white font-bold py-3 text-base rounded-lg hover:bg-blue-700 transition">Subscribe now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gray-900 shadow-lg">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-white">Learning Modules</h2>
        </div>
        <nav className="mt-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setShowPaywall(true);
              }}
              className={`w-full px-4 py-3 text-left transition ${
                activeSection === item.id
                  ? 'bg-gray-700 text-blue-400 font-bold'
                  : 'text-white hover:bg-gray-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 relative">
        {/* Top Row: Section Title, Tambo Logo, Settings Icon */}
        <div className="flex items-center mb-4 relative">
          <div className="w-64 flex-shrink-0">
            <h1 className="text-2xl font-semibold text-gray-800">
              {sidebarItems.find((item) => item.id === activeSection)?.label}
            </h1>
          </div>
          {/* Absolutely centered logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Logo />
          </div>
          <div className="z-20 ml-auto">
            <button
              onClick={() => setShowSettings((s) => !s)}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
              aria-label="Settings"
            >
              {/* Gear SVG */}
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 2.25c.47-1.1 2.03-1.1 2.5 0l.36.85a1.25 1.25 0 001.64.67l.9-.37c1.13-.47 2.23.63 1.76 1.76l-.37.9a1.25 1.25 0 00.67 1.64l.85.36c1.1.47 1.1 2.03 0 2.5l-.85.36a1.25 1.25 0 00-.67 1.64l.37.9c.47 1.13-.63 2.23-1.76 1.76l-.9-.37a1.25 1.25 0 00-1.64.67l-.36.85c-.47 1.1-2.03 1.1-2.5 0l-.36-.85a1.25 1.25 0 00-1.64-.67l-.9.37c-1.13.47-2.23-.63-1.76-1.76l.37-.9a1.25 1.25 0 00-.67-1.64l-.85-.36c-1.1-.47-1.1-2.03 0-2.5l.85-.36a1.25 1.25 0 00.67-1.64l-.37-.9c-.47-1.13.63-2.23 1.76-1.76l.9.37a1.25 1.25 0 001.64-.67l.36-.85z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
              </svg>
            </button>
            {showSettings && user && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4 flex flex-col items-start gap-2 border border-gray-200">
                <div className="text-gray-700 font-semibold truncate w-full" title={user.email || ''}>{user.email}</div>
                <button
                  onClick={handleLogout}
                  className="mt-2 w-full py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 h-full">
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
            <div className="grid grid-cols-6 gap-x-10 gap-y-6 justify-center items-center w-full max-w-4xl mx-auto">
              {Array.from({ length: 26 }, (_, i) => (
                <div key={i} className="flex items-center justify-start py-2">
                  <span className="text-2xl font-extrabold text-gray-700 mr-6">{String.fromCharCode(65 + i)}</span>
                  <span className="inline-block min-w-[120px] h-6 align-middle"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 