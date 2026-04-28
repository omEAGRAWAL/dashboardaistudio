const BASE_URL = 'https://travelycrm.reviu.store';

const softwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Yatrik',
  url: BASE_URL,
  description:
    'Yatrik is travel CRM software for Indian travel agencies. Manage leads, automate WhatsApp follow-ups, handle bookings, and build your agency website — all in one place.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'en-IN',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: '999',
    highPrice: '4999',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      billingDuration: 'P1M',
      unitText: 'month',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
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
        text: 'Yatrik is a travel CRM software built specifically for Indian travel agencies and tour operators. It helps you capture leads from Meta Ads, manage bookings, automate WhatsApp follow-ups, and publish a branded agency website — all from one dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Yatrik cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yatrik plans start at ₹999/month (incl. GST) for the Starter plan and go up to ₹4,999/month for the Pro plan with unlimited team members and advanced automation. All plans include a 15-day free trial.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does Yatrik integrate with WhatsApp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Yatrik includes a built-in WhatsApp chatbot and inbox powered by Twilio. You can set up automated Q&A flows to qualify leads, and switch to manual chat anytime from the WhatsApp inbox.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can Yatrik capture leads from Facebook and Instagram ads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Yatrik connects to Meta Lead Ads via a webhook so every lead from your Facebook or Instagram campaigns lands directly in your CRM in real time — no manual export required.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is Yatrik different from LeadSquared?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'LeadSquared is a general-purpose CRM that requires significant setup for travel use cases and is priced for enterprise. Yatrik is purpose-built for travel agencies — it includes package management, booking forms, itinerary builder, and WhatsApp chatbot out of the box, at a fraction of the cost.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why should I stop using spreadsheets to manage travel leads?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Spreadsheets don\'t remind you to follow up, can\'t auto-capture leads, break with multiple users, and give zero visibility into your sales pipeline. Yatrik centralises leads, tracks status, assigns agents, and shows you exactly where every deal stands.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Yatrik available in Hindi or regional languages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Yatrik dashboard is in English, but your customer-facing agency website and WhatsApp chatbot can be configured to communicate in any language including Hindi, Gujarati, and Tamil.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I build my travel agency website with Yatrik?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every Yatrik plan includes a website builder with customizable sections — hero banner, packages, gallery, testimonials, contact form, Google Maps, and WhatsApp button. No coding required.',
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
