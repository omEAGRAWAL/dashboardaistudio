const BASE_URL = 'https://travelycrm.reviu.store';

const softwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Yatrik',
  url: BASE_URL,
  description:
    'Yatrik is travel CRM software for Indian travel agencies. Manage leads, automate WhatsApp follow-ups, handle bookings, and build your agency website in one place.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'en-IN',
  audience: {
    '@type': 'BusinessAudience',
    audienceType: 'Travel agencies, tour operators, DMCs, and holiday sellers in India',
  },
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: '999',
    highPrice: '4999',
    offerCount: '3',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      billingDuration: 'P1M',
      unitText: 'month',
    },
  },
  featureList: [
    'Travel lead management software',
    'Meta Ads lead capture',
    'WhatsApp follow-up automation',
    'Booking management',
    'Package management',
    'Travel agency website builder',
  ],
};

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Yatrik and who is it for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yatrik is travel CRM software built for Indian travel agencies and tour operators. It helps capture leads from Meta Ads, manage bookings, automate WhatsApp follow-ups, and publish a branded agency website from one dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Yatrik cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yatrik plans start at INR 999/month including GST. Growth and Pro plans add higher lead volume, booking workflows, campaign pages, custom domains, and onboarding support.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Yatrik integrate with WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Yatrik supports WhatsApp-first travel sales with lead qualification, follow-up workflows, and customer conversation context connected to CRM records.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can Yatrik capture leads from Facebook and Instagram ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yes. Yatrik connects to Meta Lead Ads so Facebook and Instagram enquiries can land directly in the CRM without manual exports.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is Yatrik different from generic CRMs?',
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          'Yatrik includes travel-specific workflows such as packages, itineraries, bookings, WhatsApp follow-ups, and agency website pages. Generic CRMs usually need custom fields and third-party tools for these workflows.',
      },
    },
  ],
};

export default function SchemaMarkup() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
      />
    </>
  );
}
