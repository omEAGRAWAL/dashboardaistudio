import type { Metadata } from 'next';
import SchemaMarkup from '@/components/SchemaMarkup';

const BASE_URL = 'https://travelycrm.reviu.store';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Yatrik — Travel CRM Software India',
    default: 'Yatrik — #1 Travel CRM Software for Indian Agencies',
  },
  description:
    'Yatrik is the best travel CRM software in India. Capture Meta Ads leads, automate WhatsApp follow-ups, manage bookings & build your agency website. Plans from ₹999/month.',
  keywords: [
    'travel CRM software India',
    'travel agency CRM',
    'CRM for travel agents India',
    'travel lead management software',
    'WhatsApp bot for travel agency',
    'tour operator CRM India',
    'travel booking management software',
  ],
  authors: [{ name: 'Yatrik', url: BASE_URL }],
  creator: 'Yatrik',
  publisher: 'Yatrik',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'Yatrik',
    title: 'Yatrik — #1 Travel CRM Software for Indian Agencies',
    description:
      'Manage leads, automate WhatsApp, handle bookings & build your agency website. Plans from ₹999/month incl. GST.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Yatrik — Travel CRM Software India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yatrik — #1 Travel CRM Software for Indian Agencies',
    description:
      'Manage leads, automate WhatsApp, handle bookings & build your agency website. Plans from ₹999/month.',
    images: ['/og-image.png'],
    creator: '@yatrikcrm',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SchemaMarkup />
      {children}
    </>
  );
}
