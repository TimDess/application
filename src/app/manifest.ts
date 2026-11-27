import type { MetadataRoute } from 'next'
import { brand } from '@/config/brand'
import { routes } from '@/config/routes'

/**
 * Web app manifest: makes the whole site one installed app. `scope: '/'` keeps every
 * page inside the app on iOS (without it, leaving the install page's folder shows
 * Safari's toolbars).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: brand.name,
    short_name: brand.name,
    description: brand.description,
    lang: brand.language,
    dir: 'ltr',
    start_url: routes.dashboard,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: brand.colors.night,
    theme_color: brand.colors.night,
    categories: ['education', 'games', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
