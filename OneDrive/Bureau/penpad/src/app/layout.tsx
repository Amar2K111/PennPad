import './globals.css'
import { Inter } from 'next/font/google'
import { ToastProvider } from './components/ToastContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'PennPad - AI-Powered Writing Assistant',
  description: 'A comprehensive writing app with AI assistance, grammar checking, and real-time collaboration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
        {children}
        </ToastProvider>
      </body>
    </html>
  )
} 