import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { VibeGuardProvider } from '@/components/vibeguard/app-provider'
import { SiteHeader } from '@/components/vibeguard/site-header'
import { ParticleBackground } from '@/components/vibeguard/particle-background'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VibeGuard — AI Code Security Audit',
  description:
    'Real-time security platform for auditing AI-generated code. Detect secrets, vulnerable packages, and semantic vulnerabilities instantly.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        <VibeGuardProvider>
          <div className="relative min-h-screen grid-bg">
            <ParticleBackground />
            <div className="relative z-10 flex min-h-screen flex-col">
              <SiteHeader />
              <main className="w-full flex-1 px-4 py-5 md:px-6">{children}</main>
            </div>
          </div>
        </VibeGuardProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
