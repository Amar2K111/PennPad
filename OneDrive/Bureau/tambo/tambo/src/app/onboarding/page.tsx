'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({
    language: '',
    level: '',
    goals: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
    } else {
      router.push('/tutor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Let's personalize your experience
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {step} of 3
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {step === 1 && (
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                What language do you want to learn?
              </label>
              <select
                id="language"
                name="language"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={answers.language}
                onChange={(e) => setAnswers({ ...answers, language: e.target.value })}
              >
                <option value="">Select a language</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="italian">Italian</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>
          )}

          {step === 2 && (
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                What's your current level?
              </label>
              <select
                id="level"
                name="level"
                required
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={answers.level}
                onChange={(e) => setAnswers({ ...answers, level: e.target.value })}
              >
                <option value="">Select your level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          )}

          {step === 3 && (
            <div>
              <label htmlFor="goals" className="block text-sm font-medium text-gray-700">
                What are your learning goals?
              </label>
              <textarea
                id="goals"
                name="goals"
                rows={4}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., I want to be able to have basic conversations, travel comfortably, or prepare for a language exam"
                value={answers.goals}
                onChange={(e) => setAnswers({ ...answers, goals: e.target.value })}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {step === 3 ? 'Complete' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 