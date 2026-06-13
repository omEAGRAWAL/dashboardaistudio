import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { OrgProvider } from '@/components/OrgProvider';
import { SidebarProvider } from '@/components/SidebarContext';
import { Analytics } from '@vercel/analytics/next';

const BASE_URL = 'https://travelycrm.reviu.store';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | Yatrik - Travel CRM Software India',
    default: 'Yatrik - Travel CRM Software for Indian Agencies',
  },
  description:
    'Yatrik is travel CRM software for Indian travel agencies. Manage leads from Meta Ads, automate WhatsApp follow-ups, handle bookings, and build your agency website. Plans from INR 999/month.',
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
    title: 'Yatrik - Travel CRM Software for Indian Agencies',
    description:
      'Manage leads, automate WhatsApp, handle bookings, and build your agency website. Plans from INR 999/month incl. GST.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Yatrik travel CRM software for Indian agencies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yatrik - Travel CRM Software for Indian Agencies',
    description:
      'Manage leads, automate WhatsApp, handle bookings, and build your agency website. Plans from INR 999/month.',
    images: ['/opengraph-image'],
    creator: '@yatrikcrm',
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
    apple: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
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
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
        <Analytics />
      </body>
    </html>
  );
}
