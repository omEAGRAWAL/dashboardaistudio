import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

const BASE_URL = 'https://travelycrm.reviu.store';

const CITY_MAP: Record<string, { display: string; state: string; localNote: string }> = {
  delhi: {
    display: 'Delhi',
    state: 'Delhi NCR',
    localNote:
      'Delhi NCR is one of India\'s largest markets for outbound travel, with thousands of agencies competing for the same leads from Karol Bagh, Lajpat Nagar, and South Delhi.',
  },
  mumbai: {
    display: 'Mumbai',
    state: 'Maharashtra',
    localNote:
      'Mumbai travel agencies handle high-volume enquiries from corporate clients, Bollywood-adjacent leisure travellers, and NRI families — making fast follow-up critical.',
  },
  bangalore: {
    display: 'Bangalore',
    state: 'Karnataka',
    localNote:
      'Bangalore\'s tech-savvy workforce expects instant WhatsApp responses and digital-first booking experiences. Agencies that automate beat those that don\'t.',
  },
  hyderabad: {
    display: 'Hyderabad',
    state: 'Telangana',
    localNote:
      'Hyderabad has seen explosive growth in international travel — Europe, Dubai, and South-East Asia packages — creating intense competition among local agencies.',
  },
  chennai: {
    display: 'Chennai',
    state: 'Tamil Nadu',
    localNote:
      'Chennai travel agencies cater heavily to pilgrimage tourism, South India packages, and Singapore/Malaysia circuits — a diverse lead mix that benefits from a structured CRM.',
  },
  kolkata: {
    display: 'Kolkata',
    state: 'West Bengal',
    localNote:
      'Kolkata agencies see strong seasonal spikes around Puja holidays. Managing lead surges without dropping enquiries is exactly what Yatrik is built for.',
  },
  jaipur: {
    display: 'Jaipur',
    state: 'Rajasthan',
    localNote:
      'Jaipur is a hub for inbound tourism operators serving international guests, as well as outbound agencies catering to local Rajasthani travellers — Yatrik handles both.',
  },
  ahmedabad: {
    display: 'Ahmedabad',
    state: 'Gujarat',
    localNote:
      'Ahmedabad agencies serve one of India\'s most travel-enthusiastic communities. The Gujarati traveller researches extensively on WhatsApp before booking — automation pays off.',
  },
  pune: {
    display: 'Pune',
    state: 'Maharashtra',
    localNote:
      'Pune\'s young professional population and proximity to Mumbai make it a fast-growing market for weekend trips, international packages, and corporate travel.',
  },
  kochi: {
    display: 'Kochi',
    state: 'Kerala',
    localNote:
      'Kochi is a gateway for Kerala inbound tourism and a major base for agencies selling international packages to the Gulf-returnee community.',
  },
};

const VALID_CITIES = Object.keys(CITY_MAP);

export function generateStaticParams() {
  return VALID_CITIES.map((city) => ({ city }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const data = CITY_MAP[city];
  if (!data) return {};

  return {
    title: `Best Travel CRM Software in ${data.display} | Yatrik`,
    description: `Yatrik helps ${data.display} travel agencies capture Meta Ads leads, automate WhatsApp follow-ups, and manage bookings — all in one CRM. Plans from ₹999/month.`,
    alternates: { canonical: `${BASE_URL}/travel-crm-${city}` },
    openGraph: {
      title: `Travel CRM Software in ${data.display} — Yatrik`,
      description: `Manage leads, WhatsApp, bookings & your agency website. Purpose-built for ${data.display} travel agencies.`,
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const data = CITY_MAP[city];
  if (!data) notFound();

  const { display, state, localNote } = data;

  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Travel CRM Software for {display} Travel Agencies
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-2xl">
          Yatrik is the travel CRM used by agencies across {state} to capture leads faster, follow
          up on WhatsApp automatically, and convert more enquiries into confirmed bookings.
        </p>
        <p className="text-gray-600 mb-16 max-w-2xl leading-relaxed">{localNote}</p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {[
            {
              title: `Capture every lead from ${display} Meta Ads`,
              body: `Your Facebook and Instagram campaigns targeting ${display} travellers generate leads that land in Yatrik in under 5 seconds — no CSV downloads, no copy-paste.`,
            },
            {
              title: `WhatsApp automation for ${display} enquiries`,
              body: `Deploy an automated WhatsApp chatbot for your ${display} agency number. Qualify destination, dates, and budget automatically — even on weekends and late at night.`,
            },
            {
              title: 'Full pipeline visibility',
              body: `See every ${display} lead\'s stage — New Enquiry → Contacted → Qualified → Booked — and know exactly where each deal stands without asking your team.`,
            },
            {
              title: 'Agency website with ${display} branding',
              body: `Publish a branded agency website in minutes. List your ${display}-area packages, upload photos, add testimonials, and embed Google Maps for your office address.`,
            },
          ].map((card) => (
            <div key={card.title} className="border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{card.title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-16 text-center">
          {[
            { stat: '₹999', label: 'Starting price / month' },
            { stat: '15 days', label: 'Free trial, no card' },
            { stat: '< 1 hr', label: 'Setup time' },
          ].map((item) => (
            <div key={item.label} className="bg-blue-50 rounded-2xl p-8">
              <p className="text-3xl font-extrabold text-blue-600 mb-2">{item.stat}</p>
              <p className="text-gray-600 text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-500 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            The best-value travel CRM for {display} agencies
          </h2>
          <p className="mb-6 opacity-90">
            Join travel agencies across {state} already using Yatrik to grow their bookings.
          </p>
          <a
            href="/login"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition"
          >
            Start your free trial →
          </a>
        </div>
      </section>
    </main>
  );
}
