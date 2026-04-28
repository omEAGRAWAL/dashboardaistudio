import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features — Complete Travel CRM Toolkit',
  description:
    'Explore every Yatrik feature: Meta Ads lead capture, WhatsApp chatbot, booking management, website builder, campaign manager, and real-time analytics — built for Indian travel agencies.',
  alternates: { canonical: 'https://travelycrm.reviu.store/features' },
};

const features = [
  {
    title: 'Meta Ads Lead Capture',
    description:
      'Connect your Facebook and Instagram lead forms via webhook. Every new enquiry lands in your CRM in seconds — no manual exports, no missed leads.',
  },
  {
    title: 'WhatsApp Chatbot & Inbox',
    description:
      'Deploy an automated WhatsApp Q&A bot to qualify inbound leads 24/7. Switch to manual chat any time from the shared inbox — all in one place.',
  },
  {
    title: 'Lead Pipeline Management',
    description:
      'Track every lead through stages: New Enquiry → Contacted → Qualified → Negotiation → Booked. Assign agents, add remarks, and never lose a hot lead.',
  },
  {
    title: 'Booking & Package Management',
    description:
      'Create tour packages with multi-image galleries, per-person pricing, and inclusions. Accept bookings with a branded form and manage all bookings from a single dashboard.',
  },
  {
    title: 'Agency Website Builder',
    description:
      'Publish a fully branded travel agency website in minutes — hero, packages, gallery, testimonials, contact form, and WhatsApp button. No code, no developer.',
  },
  {
    title: 'Campaign Manager',
    description:
      'Plan and track marketing campaigns across channels. Attach leads to campaigns to measure which ads drive bookings, not just enquiries.',
  },
  {
    title: 'Team & Role Management',
    description:
      'Invite agents with email, set roles (admin / agent), and control what each team member can see and do inside your CRM.',
  },
  {
    title: 'Real-time Analytics',
    description:
      'Live stats on lead volume, conversion rate, revenue pipeline, and top-performing packages — so you always know what to focus on.',
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Everything a Travel Agency Needs — in One CRM
        </h1>
        <p className="text-xl text-gray-600 mb-16 max-w-2xl">
          Yatrik is travel CRM software built from the ground up for Indian travel agencies and tour
          operators. Here&apos;s what&apos;s inside.
        </p>
        <div className="grid md:grid-cols-2 gap-10">
          {features.map((f) => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-8 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{f.title}</h2>
              <p className="text-gray-600 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
