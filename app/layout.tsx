import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/lib/user-context'
import { ServiceWorkerProvider } from '@/components/service-worker-provider'
import { ChunkErrorHandler } from '@/components/chunk-error-handler'

export const metadata: Metadata = {
  title: 'Sistema IRBANA',
  description: 'Sistema de Gestão Empresarial',
  generator: 'IRBANA',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IRBANA PWA',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <ChunkErrorHandler />
        <ServiceWorkerProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ServiceWorkerProvider>
        <Toaster />
      </body>
    </html>
  )
}
