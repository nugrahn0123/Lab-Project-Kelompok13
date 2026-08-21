import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import BottomNavWrapper from '@/components/BottomNavWrapper'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WarTiket — Konser Indonesia',
  description: 'Beli tiket konser dengan mudah dan aman',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="bg-wt-bg font-sans">
        <div className="flex justify-center min-h-screen bg-wt-bg">
          <div className="w-full max-w-[430px] bg-wt-surface min-h-screen relative overflow-x-hidden">
            {children}
            <BottomNavWrapper />
          </div>
        </div>
      </body>
    </html>
  )
}
