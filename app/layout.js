import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/layout/ToastProvider'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'ArshaNemi PDF Tools',
  description: 'E-commerce PDF shipping label cropper & sorter',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} h-full flex flex-col`}>
        <ThemeProvider>
          <ToastProvider>
            <Header />
            <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--lt-bg-base)' }}>
              {children}
            </main>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
