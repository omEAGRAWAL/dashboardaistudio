import type { Metadata } from 'next';
import RootGate from '@/components/RootGate';

export const metadata: Metadata = {
  title: 'Yatrik — #1 CRM for Travel Agencies in India | Free Trial',
  description:
    'Yatrik is the all-in-one CRM built for Indian travel agencies & tour operators. Manage leads, packages, bookings & your website in one dashboard. ₹1,000/month. 1 month free trial + free setup.',
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
    'tour operator management software India',
    'DMC software India',
    'travel agency software Delhi',
    'travel agency software Mumbai',
    'travel agency software Bangalore',
    'travel CRM India',
  ].join(', '),
  openGraph: {
    title: 'Yatrik — #1 CRM for Travel Agencies in India',
    description:
      'Stop losing leads. Start closing more bookings. Yatrik is the all-in-one CRM for Indian travel agencies & DMCs. Try free for 1 month.',
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yatrik — #1 CRM for Travel Agencies in India',
    description:
      'All-in-one travel agency CRM. Leads, packages, bookings & website builder. ₹1,000/month. 1 month free trial.',
  },
  alternates: {
    canonical: 'https://travelycrm.reviu.store',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Yatrik',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://travelycrm.reviu.store',
      description:
        'All-in-one CRM software for travel agencies and tour operators in India. Manage leads, packages, bookings, team, and build your travel website — all in one place.',
      offers: {
        '@type': 'Offer',
        price: '1000',
        priceCurrency: 'INR',
        priceValidUntil: '2027-12-31',
        availability: 'https://schema.org/InStock',
        description: '1 month free trial included. Free initial setup.',
      },
      featureList: [
        'Lead Management',
        'Package Management',
        'Booking Management',
        'Website Builder',
        'Team Management',
        'Meta Ads Integration',
        'WhatsApp Integration',
        'Analytics & Reports',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is there a free trial for Yatrik?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! Yatrik offers a full 1-month free trial with all features included. No credit card required.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does Yatrik cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yatrik costs ₹1,000 per month after the free trial. This includes all features, free initial setup, and customer support.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is Yatrik better than Travefy or Sembark for India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yatrik is purpose-built for India. Unlike Travefy (US-based, ~₹4,000/month, no India support), Yatrik offers Indian payment gateways, local support, GST invoices, and a built-in website builder at just ₹1,000/month.',
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      name: 'Yatrik',
      url: 'https://travelycrm.reviu.store',
      description: 'Travel Agency CRM Software built for India',
      areaServed: 'IN',
    },
  ],
};

export default function RootPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RootGate />
    </>
  );
}
