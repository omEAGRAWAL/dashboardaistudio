import type { Metadata } from 'next';
import MarketingPageContent from '@/components/MarketingPageContent';

export const metadata: Metadata = {
  title: 'Travlyy — #1 CRM for Travel Agencies in India | Free Trial',
  description:
    'Travlyy is the all-in-one CRM built for Indian travel agencies & tour operators. Manage leads, packages, bookings & your website in one dashboard. ₹1,000/month. 1 month free trial + free setup.',
  alternates: {
    canonical: 'https://travelycrm.reviu.store',
  },
};

export default function MarketingPage() {
  return <MarketingPageContent />;
}
