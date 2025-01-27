// src/app/layout.tsx
import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import { Providers } from './Providers'

const quicksand = Quicksand({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-quicksand',
})

export const metadata: Metadata = {
  title: 'SunWay',
  description: 'Kindergarten Management System',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body className={`${quicksand.className} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}