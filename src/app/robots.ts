import type { MetadataRoute } from 'next'
import { siteUrl } from '@/config/brand'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/cgu', '/confidentialite'],
      disallow: [
        '/accueil',
        '/explorer',
        '/jouer',
        '/ligue',
        '/profil',
        '/parametres',
        '/onboarding',
        '/api',
        '/auth',
      ],
    },
    host: siteUrl(),
  }
}
