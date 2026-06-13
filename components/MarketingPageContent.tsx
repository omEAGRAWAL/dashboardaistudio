import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  Globe2,
  MapPinned,
  MessageCircle,
  MousePointerClick,
  Plane,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

const WHATSAPP_NUMBER = '917609098787';
const WHATSAPP_URL =
  `https://wa.me/${WHATSAPP_NUMBER}?text=Hi%2C%20I%20want%20a%20demo%20of%20Yatrik%20CRM%20for%20my%20travel%20agency.`;

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: {
    href: string;
    label: string;
  };
};

const workflow = [
  {
    icon: MousePointerClick,
    title: 'Capture every enquiry',
    description:
      'Bring Meta Ads, website forms, WhatsApp enquiries, walk-ins, and referrals into one travel lead management pipeline.',
  },
  {
    icon: UsersRound,
    title: 'Assign the right agent',
    description:
      'Route hot leads to your team, track ownership, and see exactly who is following up on each traveller.',
  },
  {
    icon: MessageCircle,
    title: 'Follow up on WhatsApp',
    description:
      'Send package details, reminders, booking confirmations, and payment nudges without losing the lead context.',
  },
  {
    icon: CalendarCheck,
    title: 'Convert to bookings',
    description:
      'Manage passengers, travel dates, advance payments, invoices, and booking status from the same CRM record.',
  },
];

const features: Feature[] = [
  {
    icon: ClipboardList,
    title: 'Travel lead management software',
    description:
      'Track new enquiries, qualified leads, proposals, negotiation, booked trips, and lost reasons with a clean sales pipeline.',
    link: { href: '/travel-lead-management', label: 'Lead management page' },
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp bot for travel agency teams',
    description:
      'Qualify travellers, answer common questions, and keep package conversations connected to CRM records.',
    link: { href: '/whatsapp-bot-travel-agency', label: 'WhatsApp automation' },
  },
  {
    icon: Globe2,
    title: 'SEO-ready travel agency website builder',
    description:
      'Publish packages, destination pages, contact forms, FAQs, and WhatsApp calls to action without waiting for a developer.',
    link: { href: '/features', label: 'Website builder features' },
  },
  {
    icon: CalendarCheck,
    title: 'Booking and package management',
    description:
      'Create itineraries, price packages, collect passenger details, and keep every booking detail in one operational view.',
  },
  {
    icon: BarChart3,
    title: 'Conversion analytics',
    description:
      'See which channels, campaigns, agents, and destinations are creating revenue instead of only counting raw leads.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for Indian agencies',
    description:
      'GST-friendly pricing, local support, WhatsApp-first workflows, and city landing pages for agencies selling across India.',
  },
];

const keywordClusters = [
  {
    label: 'Core buying intent',
    terms: ['travel CRM software India', 'travel agency CRM India', 'CRM for travel agents India'],
  },
  {
    label: 'Operations intent',
    terms: ['travel lead management software', 'travel booking management software', 'tour operator CRM India'],
  },
  {
    label: 'Channel intent',
    terms: ['WhatsApp bot for travel agency', 'Meta Ads lead capture CRM', 'travel agency website builder India'],
  },
  {
    label: 'Local intent',
    terms: ['travel CRM Delhi', 'travel CRM Mumbai', 'travel CRM Bangalore'],
  },
];

const cityLinks = [
  ['Delhi', '/travel-crm-delhi'],
  ['Mumbai', '/travel-crm-mumbai'],
  ['Bangalore', '/travel-crm-bangalore'],
  ['Hyderabad', '/travel-crm-hyderabad'],
  ['Chennai', '/travel-crm-chennai'],
  ['Jaipur', '/travel-crm-jaipur'],
];

const plans = [
  {
    name: 'Starter',
    price: 'INR 999',
    description: 'For solo agents and new agencies that need a simple CRM pipeline.',
    features: ['Lead pipeline', 'Meta Ads lead capture', 'Website builder', 'WhatsApp-ready contact flow'],
    href: '/login',
  },
  {
    name: 'Growth',
    price: 'INR 2,499',
    description: 'For teams that want bookings, campaigns, and higher lead volume.',
    features: ['Everything in Starter', 'Booking management', 'Campaign pages', 'Priority support'],
    href: '/login',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'INR 4,999',
    description: 'For established agencies that need automation and a stronger web presence.',
    features: ['Everything in Growth', 'Custom domain support', 'Advanced automation', 'Dedicated onboarding'],
    href: '/login',
  },
];

const comparisonRows = [
  ['Lead capture from Meta Ads', 'Included', 'Manual export', 'Needs custom setup'],
  ['Travel packages and itineraries', 'Built in', 'Scattered files', 'Usually add-on'],
  ['WhatsApp follow-up context', 'CRM-linked', 'Lost in chats', 'Third-party connector'],
  ['Booking and payment tracking', 'One dashboard', 'Manual formulas', 'Custom fields'],
  ['SEO-ready agency website', 'Included', 'Separate vendor', 'Separate vendor'],
];

const faqs = [
  {
    question: 'What is the best CRM for travel agencies in India?',
    answer:
      'The best CRM for a travel agency should manage leads, packages, WhatsApp conversations, bookings, team assignment, and website enquiries together. Yatrik is built around those travel-specific workflows instead of starting from a generic sales CRM.',
  },
  {
    question: 'Can Yatrik help my agency get organic leads from Google?',
    answer:
      'Yes. Yatrik gives agencies SEO-ready website pages for packages, destinations, FAQs, contact details, and local landing pages. The CRM landing page also targets high-intent queries such as travel CRM software India, CRM for travel agents India, and travel lead management software.',
  },
  {
    question: 'Does Yatrik replace spreadsheets for travel lead tracking?',
    answer:
      'Yes. It replaces manual sheets with lead stages, owners, follow-up notes, reminders, source tracking, and conversion reports. Your team sees the same live pipeline instead of passing files around.',
  },
  {
    question: 'Does Yatrik work with WhatsApp?',
    answer:
      'Yatrik is designed for WhatsApp-first travel sales. You can connect WhatsApp workflows to lead records, use bot-style qualification, and continue conversations without losing package or booking context.',
  },
];

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-sm font-semibold text-emerald-700">{eyebrow}</p>
      <h2 className="text-3xl font-bold text-gray-950">{title}</h2>
      <p className="mt-4 text-base leading-7 text-gray-600">{description}</p>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Yatrik home">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950 text-sm font-bold text-white">
        Y
      </span>
      <span className="text-lg font-bold text-gray-950">Yatrik</span>
      <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
        Travel CRM
      </span>
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-xl shadow-gray-200/60">
      <div className="flex h-12 items-center justify-between border-b border-gray-200 px-4">
        <div>
          <p className="text-sm font-semibold text-gray-950">Today&apos;s travel enquiries</p>
          <p className="text-xs text-gray-500">Live CRM pipeline</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Online
        </div>
      </div>
      <div className="grid gap-0 md:grid-cols-[1.5fr_0.9fr]">
        <div className="border-b border-gray-200 md:border-b-0 md:border-r">
          {[
            ['Manali honeymoon package', 'Facebook Ads', 'Proposal sent', 'INR 74,000'],
            ['Dubai family trip', 'Google search', 'Qualified', 'INR 2,40,000'],
            ['Kashmir group tour', 'WhatsApp', 'Follow-up due', 'INR 1,18,000'],
            ['Bali honeymoon', 'Website form', 'New enquiry', 'INR 1,96,000'],
          ].map(([lead, source, status, value]) => (
            <div key={lead} className="grid grid-cols-[1fr_auto] gap-4 border-b border-gray-100 px-4 py-4 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{lead}</p>
                <p className="mt-1 text-xs text-gray-500">{source}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-amber-700">{status}</p>
                <p className="mt-1 text-sm font-bold text-gray-950">{value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500">Conversion this month</p>
            <p className="mt-2 text-3xl font-bold text-gray-950">31%</p>
            <p className="mt-2 text-xs text-emerald-700">+9% after faster follow-ups</p>
          </div>
          <div className="space-y-3">
            {['New enquiry', 'Contacted', 'Proposal sent', 'Booked'].map((stage, index) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <div className="h-2 flex-1 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${92 - index * 18}%` }}
                  />
                </div>
                <span className="w-24 text-xs font-medium text-gray-600">{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPageContent() {
  return (
    <main className="min-h-screen bg-white text-gray-950">
      <section className="relative overflow-hidden border-b border-gray-200">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2200&q=80"
          alt="A bright travel agency team working together on a laptop"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-white/90" />
        <div className="relative">
          <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              <Logo />
              <div className="hidden items-center gap-7 text-sm font-semibold text-gray-700 md:flex">
                <a href="#workflow" className="hover:text-gray-950">Workflow</a>
                <a href="#seo" className="hover:text-gray-950">Google leads</a>
                <a href="#features" className="hover:text-gray-950">Features</a>
                <a href="#pricing" className="hover:text-gray-950">Pricing</a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm hover:border-gray-400 sm:inline-flex"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp
                </a>
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
                >
                  Start trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </header>

          <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-800">
                Built for Indian travel agencies, tour operators, DMCs, and holiday sellers
              </p>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950">
                Travel CRM software for Indian travel agencies
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
                Yatrik helps you capture travel leads from Google, Meta Ads, WhatsApp, and your
                website, then turn them into booked tours with follow-ups, packages, bookings,
                team assignment, and SEO-ready agency pages.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gray-950 px-6 text-sm font-bold text-white shadow-lg shadow-gray-950/15 hover:bg-gray-800"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-sm font-bold text-gray-900 shadow-sm hover:border-gray-400"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  Book WhatsApp demo
                </a>
              </div>
              <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
                {[
                  ['15-day', 'free trial'],
                  ['INR 999', 'starting plan'],
                  ['SEO', 'website pages'],
                ].map(([stat, label]) => (
                  <div key={stat} className="rounded-lg border border-gray-200 bg-white/80 p-3">
                    <p className="text-lg font-bold text-gray-950">{stat}</p>
                    <p className="text-xs font-medium text-gray-600">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="border-b border-gray-200 bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Lead to booking workflow"
            title="A CRM built around how travel agencies actually sell"
            description="Generic CRMs stop at contacts. Yatrik keeps the full travel sales journey connected: enquiry source, traveller needs, package options, WhatsApp history, payments, and final booking."
          />
          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((item) => (
              <article key={item.title} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <item.icon className="mb-4 h-6 w-6 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="mb-3 text-sm font-semibold text-emerald-700">Product preview</p>
            <h2 className="text-3xl font-bold text-gray-950">One dashboard for leads, packages, bookings, and revenue</h2>
            <p className="mt-5 text-base leading-7 text-gray-600">
              See which enquiries need attention, which package was shared, which agent owns the
              lead, and how much revenue is sitting in your travel pipeline.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                'Real-time lead capture',
                'Package and itinerary context',
                'Follow-up reminders',
                'Booking revenue reports',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="seo" className="border-y border-gray-200 bg-[#fbfaf7] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Google organic lead strategy"
            title="Turn travel agency searches into CRM demos"
            description="The landing page now targets commercial travel-agency software searches while the product supports agency websites that can rank for packages, destinations, and local travel services."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {keywordClusters.map((cluster) => (
              <article key={cluster.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <Search className="mb-4 h-5 w-5 text-amber-700" />
                <h3 className="text-base font-bold text-gray-950">{cluster.label}</h3>
                <ul className="mt-4 space-y-2">
                  {cluster.terms.map((term) => (
                    <li key={term} className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {term}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <MapPinned className="mb-4 h-6 w-6 text-rose-700" />
                <h3 className="text-xl font-bold text-gray-950">Local pages catch city demand</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  City pages give Google a clean URL for searches like CRM for travel agencies in
                  Delhi, Mumbai, Bangalore, Hyderabad, Chennai, and Jaipur.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {cityLinks.map(([city, href]) => (
                  <Link
                    key={city}
                    href={href}
                    className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    Travel CRM {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Complete travel CRM toolkit"
            title="The pages, automations, and reports your agency needs"
            description="Yatrik combines the buying keywords travellers and agency owners search with the operational features your team needs every day."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <feature.icon className="mb-5 h-6 w-6 text-gray-950" />
                <h3 className="text-lg font-bold text-gray-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{feature.description}</p>
                {feature.link && (
                  <Link
                    href={feature.link.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
                  >
                    {feature.link.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Why switch"
            title="Built for travel work, not generic contact storage"
            description="Yatrik gives travel teams a focused CRM layer while still keeping the interface simple enough for daily use."
          />
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-gray-950 text-white">
                <tr>
                  <th className="px-5 py-4 text-left font-semibold">Capability</th>
                  <th className="px-5 py-4 text-left font-semibold">Yatrik</th>
                  <th className="px-5 py-4 text-left font-semibold">Spreadsheets</th>
                  <th className="px-5 py-4 text-left font-semibold">Generic CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {comparisonRows.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => (
                      <td key={`${cell}-${index}`} className={`px-5 py-4 ${index === 0 ? 'font-semibold text-gray-950' : 'text-gray-700'}`}>
                        {index === 1 ? (
                          <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
                            <Check className="h-4 w-4" />
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/travel-crm-vs-spreadsheets" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-gray-400">
              Compare with spreadsheets
            </Link>
            <Link href="/travel-crm-vs-leadsquared" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-gray-400">
              Compare with LeadSquared
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="Pricing"
            title="Start lean, then scale your agency workflow"
            description="All plans are built for travel agencies and include a free trial. Upgrade when your team, lead volume, or website needs grow."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-lg border p-6 shadow-sm ${
                  plan.highlighted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'
                }`}
              >
                {plan.highlighted && (
                  <p className="mb-4 inline-flex rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                    Most popular
                  </p>
                )}
                <h3 className="text-xl font-bold text-gray-950">{plan.name}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{plan.description}</p>
                <p className="mt-6 text-3xl font-bold text-gray-950">{plan.price}</p>
                <p className="mt-1 text-sm text-gray-500">per month, incl. GST</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md text-sm font-bold ${
                    plan.highlighted
                      ? 'bg-gray-950 text-white hover:bg-gray-800'
                      : 'border border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                  }`}
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            Want setup help? <a href={WHATSAPP_URL} className="font-bold text-emerald-700 hover:text-emerald-900">Message us on WhatsApp</a>.
          </p>
        </div>
      </section>

      <section id="faq" className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionIntro
            eyebrow="FAQ"
            title="Questions travel agency owners ask before switching"
            description="Short answers for agency owners comparing CRM, spreadsheets, WhatsApp workflows, and organic lead generation."
          />
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="group rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-gray-950">
                  {faq.question}
                  <ArrowRight className="h-4 w-4 text-gray-400 transition group-open:rotate-90" />
                </summary>
                <p className="mt-4 text-sm leading-6 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <Plane className="mx-auto mb-5 h-9 w-9 text-emerald-700" />
          <h2 className="text-3xl font-bold text-gray-950">Ready to stop losing travel enquiries?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600">
            Start with the CRM, publish your SEO-ready agency pages, and bring every Google,
            Meta, WhatsApp, and website enquiry into one pipeline.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-gray-950 px-6 text-sm font-bold text-white hover:bg-gray-800"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 text-sm font-bold text-gray-900 hover:border-gray-400"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              Talk to Yatrik
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-950 py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-gray-950">
                Y
              </span>
              <span className="text-lg font-bold">Yatrik</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
              Travel CRM software for Indian agencies. Lead management, WhatsApp follow-up,
              bookings, packages, and SEO-ready websites.
            </p>
          </div>
          <div className="grid gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-bold text-white">Product</p>
              <div className="mt-3 space-y-2 text-gray-400">
                <Link href="/features" className="block hover:text-white">Features</Link>
                <Link href="/pricing" className="block hover:text-white">Pricing</Link>
                <Link href="/travel-lead-management" className="block hover:text-white">Lead management</Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Growth</p>
              <div className="mt-3 space-y-2 text-gray-400">
                <Link href="/blog" className="block hover:text-white">Blog</Link>
                <Link href="/whatsapp-bot-travel-agency" className="block hover:text-white">WhatsApp bot</Link>
                <Link href="/travel-crm-vs-spreadsheets" className="block hover:text-white">Vs spreadsheets</Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-white">Contact</p>
              <div className="mt-3 space-y-2 text-gray-400">
                <a href={WHATSAPP_URL} className="block hover:text-white">WhatsApp demo</a>
                <Link href="/login" className="block hover:text-white">Sign in</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 inline-flex h-12 items-center gap-2 rounded-full bg-emerald-600 px-5 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 hover:bg-emerald-700"
        aria-label="Chat with Yatrik on WhatsApp"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp</span>
      </a>
    </main>
  );
}
