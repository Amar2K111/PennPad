'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/firebase'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/tutor')
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    }
  }

  const handleGoogle = async () => {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      router.push('/tutor')
    } catch (err: any) {
      setError(err.message || 'Erreur Google')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#16202A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white font-sans tracking-wide">
            Connexion
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full px-4 py-3 rounded-xl bg-[#202C39] border border-[#3A4A5A] placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-medium"
              placeholder="E-mail ou nom d'utilisateur"
            />
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="block w-full px-4 py-3 rounded-xl bg-[#202C39] border border-[#3A4A5A] placeholder-gray-300 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-base font-medium"
                placeholder="Mot de passe"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 cursor-pointer select-none">Oublié ?</span>
            </div>
          </div>
          {error && <div className="text-red-400 text-center font-bold">{error}</div>}
          <div>
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#28C6FF] text-[#16202A] font-extrabold text-base shadow-lg border-b-4 border-[#1B8FC6] tracking-wide hover:bg-[#1FB6FF] active:bg-[#009EEB] transition-all duration-150"
              style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.10)' }}
            >
              SE CONNECTER
            </button>
          </div>
        </form>
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-[#2A3744]" />
          <span className="mx-4 text-[#6B7A8F] font-bold">OU</span>
          <div className="flex-grow h-px bg-[#2A3744]" />
        </div>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={handleGoogle}
            className="flex items-center justify-center w-full py-3 rounded-2xl border border-[#3A4A5A] bg-[#16202A] text-white font-extrabold text-base gap-2 hover:bg-[#202C39] transition-all duration-150 shadow"
          >
            <span className="text-xl"><svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><g id='SVGRepo_bgCarrier' stroke-width='0'></g><g id='SVGRepo_tracerCarrier' stroke-linecap='round' stroke-linejoin='round'></g><g id='SVGRepo_iconCarrier'><path d='M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.133-2.789-6.133-6.148 0-3.359 2.758-6.148 6.133-6.148 1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.711-1.57-3.922-2.531-6.656-2.531-5.523 0-10 4.477-10 10s4.477 10 10 10c5.742 0 9.547-4.023 9.547-9.695 0-.652-.07-1.148-.148-1.523z' fill='#FFC107'></path><path d='M3.152 7.345l3.281 2.406c.891-1.789 2.672-2.953 4.617-2.953 1.125 0 2.195.391 3.016 1.164l2.844-2.766c-1.711-1.57-3.922-2.531-6.656-2.531-3.797 0-7.031 2.484-8.406 5.953z' fill='#FF3D00'></path><path d='M12 22c2.672 0 4.922-.883 6.563-2.406l-3.047-2.484c-.828.617-1.953.977-3.516.977-2.828 0-5.219-1.906-6.07-4.453l-3.242 2.5c1.352 3.406 4.719 5.866 8.312 5.866z' fill='#4CAF50'></path><path d='M21.805 10.023h-9.765v3.977h5.617c-.242 1.242-1.484 3.648-5.617 3.648-3.375 0-6.133-2.789-6.133-6.148 0-3.359 2.758-6.148 6.133-6.148 1.922 0 3.211.82 3.953 1.523l2.703-2.633c-1.711-1.57-3.922-2.531-6.656-2.531-5.523 0-10 4.477-10 10s4.477 10 10 10c5.742 0 9.547-4.023 9.547-9.695 0-.652-.07-1.148-.148-1.523z' fill='none'></path></g></svg></span>
            <span>Google</span>
          </button>
        </div>
        <div className="text-center mt-4">
          <Link href="/auth/signup" className="text-sm text-blue-400 hover:text-blue-300 font-bold">
            Pas de compte ? S'inscrire
          </Link>
        </div>
      </div>
    </div>
  )
} 