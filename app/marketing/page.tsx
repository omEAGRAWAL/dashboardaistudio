import type { Metadata } from 'next';
import MarketingPageContent from '@/components/MarketingPageContent';

export const metadata: Metadata = {
  title: 'Travel CRM Software India for Agencies | Yatrik',
  description:
    'Yatrik is travel CRM software for Indian travel agencies. Capture Google, Meta Ads, WhatsApp, and website leads, then manage packages, bookings, and follow-ups.',
  keywords: [
    'travel CRM software India',
    'travel agency CRM India',
    'CRM for travel agents India',
    'travel agency management software India',
    'tour operator software India',
    'travel lead management software',
    'travel agency website builder India',
    'travel booking management software India',
    'WhatsApp bot for travel agency',
  ],
  openGraph: {
    title: 'Travel CRM Software India for Agencies | Yatrik',
    description:
      'Capture travel leads from Google, Meta Ads, WhatsApp, and your website, then manage packages, bookings, and follow-ups in Yatrik.',
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
