import type { Metadata } from 'next';
import MarketingPageContent from '@/components/MarketingPageContent';

export const metadata: Metadata = {
  title: 'Yatrik — #1 CRM for Travel Agencies in India | Plans from ₹899',
  description:
    'Yatrik is the all-in-one CRM for Indian travel agencies. Manage leads, bookings, campaigns & build your website. Plans from ₹899/month incl. GST. 15-day free trial. Call/WhatsApp: 7609098787.',
  keywords: [
    'travel agency CRM India',
    'CRM for travel agents India',
    'travel agency management software India',
    'tour operator software India',
    'travel leads management software',
    'travel agency website builder India',
    'travel booking management software India',
    'best CRM for travel agencies India',
    'travel agency software',
    'travel CRM India',
    'campaign management travel agency',
  ].join(', '),
  openGraph: {
    title: 'Yatrik — #1 CRM for Travel Agencies in India',
    description: 'Leads, bookings, campaigns & website builder. Plans from ₹899/month incl. GST. 15-day free trial.',
    type: 'website',
    locale: 'en_IN',
  },
  alternates: {
    canonical: 'https://travelycrm.reviu.store',
  },
};

export default function MarketingPage() {
  return <MarketingPageContent />;
}
