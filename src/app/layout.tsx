import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import { AmbientBackground } from '@/components/layout/ambient-background'
import { ThemeScript } from '@/components/theme/theme-script'
import { ThemeWatcher } from '@/components/theme/theme-watcher'
import { brand, siteUrl } from '@/config/brand'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${brand.name} · Développe ta culture`, template: `%s · ${brand.name}` },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: brand.name,
    title: brand.name,
    description: brand.tagline,
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: brand.colors.night },
    { media: '(prefers-color-scheme: light)', color: brand.colors.paper },
  ],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang={brand.language}
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable}`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent"
        >
          Aller au contenu
        </a>
        <AmbientBackground />
        {children}
        <ThemeWatcher />
      </body>
    </html>
  )
}
