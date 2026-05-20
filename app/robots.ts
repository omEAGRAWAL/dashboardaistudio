import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { absoluteUrl, PLATFORM_URL, resolveAgencyByHost } from '@/lib/public-seo';

const PRIVATE_ROUTES = [
  '/home',
  '/onboarding',
  '/settings',
  '/packages',
  '/bookings',
  '/team',
  '/website-builder',
  '/admin',
  '/whatsapp',
  '/chatbot',
  '/campaign-builder',
  '/api/',
  '/site/',
];

const PLATFORM_PUBLIC_ROUTES = [
  '/',
  '/marketing',
  '/features',
  '/pricing',
  '/blog',
  '/travel-crm-vs-leadsquared',
  '/travel-crm-vs-spreadsheets',
  '/whatsapp-bot-travel-agency',
  '/travel-lead-management',
  '/travel-crm-delhi',
  '/travel-crm-mumbai',
  '/travel-crm-bangalore',
  '/travel-crm-hyderabad',
  '/travel-crm-chennai',
  '/travel-crm-kolkata',
  '/travel-crm-jaipur',
  '/travel-crm-ahmedabad',
  '/travel-crm-pune',
  '/travel-crm-kochi',
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const protocol = (h.get('x-forwarded-proto') || 'https').split(',')[0];
  const ctx = await resolveAgencyByHost(host);

  if (ctx) {
    const base = `${protocol}://${ctx.canonicalHost}`;
    return {
      rules: [
        {
          userAgent: '*',
          allow: ['/', '/package/', '/about-us', '/terms-conditions', '/privacy-policy', '/cancellation-refund', '/campaign'],
          disallow: PRIVATE_ROUTES,
        },
        {
          userAgent: 'OAI-SearchBot',
          allow: ['/'],
          disallow: PRIVATE_ROUTES,
        },
      ],
      sitemap: absoluteUrl(base, '/sitemap.xml'),
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: PLATFORM_PUBLIC_ROUTES,
        disallow: [...PRIVATE_ROUTES, '/campaign'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: PLATFORM_PUBLIC_ROUTES,
        disallow: [...PRIVATE_ROUTES, '/campaign'],
      },
    ],
    sitemap: `${PLATFORM_URL}/sitemap.xml`,
  };
}
