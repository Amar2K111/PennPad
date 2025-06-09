import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="flex flex-row items-center justify-between px-16 py-4">
        <div className="text-3xl font-extrabold text-blue-600 tracking-tight select-none ml-4">
          TAMBO
        </div>
        <div className="text-sm font-semibold text-gray-400 select-none mr-4">
          SITE LANGUAGE: ENGLISH
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-extrabold text-blue-600 mb-2">TAMBO</div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-black text-center mb-6 leading-tight">
            The fun, effective way to learn a language!
          </h1>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link
              href="/auth/signup"
              className="rounded-full bg-blue-500 px-6 py-4 text-white font-extrabold text-lg text-center shadow-lg hover:bg-blue-400 active:bg-blue-600 transition-all duration-150 border-b-4 border-blue-700"
              style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.10)' }}
            >
              C'EST PARTI !
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-2xl border-2 border-gray-200 px-6 py-4 text-sky-500 font-extrabold text-lg text-center bg-white hover:bg-gray-50 transition-all duration-150 shadow"
              style={{ boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.06)' }}
            >
              J'AI DÉJÀ UN COMPTE
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
