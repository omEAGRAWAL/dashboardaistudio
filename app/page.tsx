import type { Metadata } from 'next';
import AuthRedirect from '@/components/AuthRedirect';
import MarketingPageContent from '@/components/MarketingPageContent';

const BASE_URL = 'https://travelycrm.reviu.store';
const TITLE = 'Travel CRM Software India for Agencies | Yatrik';
const DESCRIPTION =
  'Yatrik is travel CRM software for Indian travel agencies. Capture Google, Meta Ads, WhatsApp, and website leads, then manage packages, bookings, and follow-ups.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'travel CRM software India',
    'travel agency CRM India',
    'CRM for travel agents India',
    'travel agency management software India',
    'travel lead management software',
    'tour operator CRM India',
    'travel booking management software',
    'WhatsApp bot for travel agency',
    'travel agency website builder India',
    'Meta Ads lead capture CRM',
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: 'Yatrik',
    type: 'website',
    locale: 'en_IN',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Yatrik travel CRM software for Indian travel agencies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#organization`,
      name: 'Yatrik',
      url: BASE_URL,
      description: 'Travel CRM software for Indian travel agencies and tour operators.',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${BASE_URL}/#website`,
      name: 'Yatrik',
      url: BASE_URL,
      inLanguage: 'en-IN',
      publisher: {
        '@id': `${BASE_URL}/#organization`,
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${BASE_URL}/#software`,
      name: 'Yatrik',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: BASE_URL,
      inLanguage: 'en-IN',
      description: DESCRIPTION,
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Travel agencies, tour operators, DMCs, and holiday sellers in India',
      },
      featureList: [
        'Travel lead management software',
        'Meta Ads lead capture',
        'WhatsApp follow-up automation',
        'Package and itinerary management',
        'Booking management',
        'Travel agency website builder',
        'SEO-ready landing pages',
        'Team assignment and analytics',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Starter',
          price: '999',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Growth',
          price: '2499',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/pricing`,
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '4999',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `${BASE_URL}/pricing`,
        },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the best CRM for travel agencies in India?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'A strong travel agency CRM should manage leads, packages, WhatsApp conversations, bookings, team assignment, and website enquiries together. Yatrik is built around those travel-specific workflows.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can Yatrik help my agency get organic leads from Google?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Yes. Yatrik supports SEO-ready agency websites, package pages, destination pages, FAQs, local landing pages, and CRM-focused pages targeting searches like travel CRM software India and CRM for travel agents India.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does Yatrik work with WhatsApp?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              'Yes. Yatrik is designed for WhatsApp-first travel sales, with WhatsApp lead qualification and follow-up context connected to CRM records.',
          },
        },
      ],
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
      <AuthRedirect />
      <MarketingPageContent />
    </>
  );
}
