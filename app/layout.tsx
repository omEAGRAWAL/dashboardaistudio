import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { OrgProvider } from '@/components/OrgProvider';
import { SidebarProvider } from '@/components/SidebarContext';
import { Analytics } from '@vercel/analytics/next';

const BASE_URL = 'https://travelycrm.reviu.store';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Yatrik — Travel CRM Software India',
    default: 'Yatrik — #1 Travel CRM Software for Indian Agencies',
  },
  description:
    'Yatrik is travel CRM software for Indian travel agencies. Manage leads from Meta Ads, automate WhatsApp follow-ups, handle bookings, and build your agency website. Plans from ₹999/month.',
  keywords: [
    'travel CRM software India',
    'travel agency CRM',
    'CRM for travel agents India',
    'travel lead management software',
    'WhatsApp bot for travel agency',
    'tour operator CRM India',
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yatrik CRM',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          <OrgProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </OrgProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
