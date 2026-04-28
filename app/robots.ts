import type { MetadataRoute } from 'next';

const BASE_URL = 'https://travelycrm.reviu.store';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
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
        ],
        disallow: [
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
          '/campaign',
          '/campaign-builder',
          '/api/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
