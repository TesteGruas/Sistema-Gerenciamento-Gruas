import type { Metadata } from 'next'
import Script from 'next/script'
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
        {process.env.NODE_ENV === 'development' ? (
          <Script id="dev-pwa-sw-nuke" strategy="beforeInteractive">
            {`(function(){
  try {
    var h = typeof location !== 'undefined' ? location.hostname : '';
    if (h !== 'localhost' && h !== '127.0.0.1' && h !== '[::1]') return;
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function(rs){
        rs.forEach(function(r){ r.unregister(); });
      });
    }
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys().then(function(keys){
        keys.forEach(function(k){
          if (k.indexOf('irbana-pwa') === 0) caches.delete(k);
        });
      });
    }
  } catch (e) {}
})();`}
          </Script>
        ) : null}
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
