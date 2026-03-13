import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/marketing'],
      disallow: ['/home', '/onboarding', '/settings', '/packages', '/bookings', '/team', '/website-builder'],
    },
    sitemap: 'https://travelycrm.reviu.store/sitemap.xml',
  };
}
