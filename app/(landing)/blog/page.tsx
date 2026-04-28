import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — Travel Agency Growth Tips & CRM Guides',
  description:
    'Practical guides for Indian travel agencies: lead management, WhatsApp automation, Meta Ads tips, and CRM best practices from the Yatrik team.',
  alternates: { canonical: 'https://travelycrm.reviu.store/blog' },
};

const posts = [
  {
    slug: 'travel-crm-vs-spreadsheets',
    title: 'Why Spreadsheets Are Killing Your Travel Agency (And What to Use Instead)',
    excerpt:
      'If you\'re managing travel leads in Excel or Google Sheets, you\'re losing bookings every day. Here\'s why — and how to fix it.',
    date: '2026-04-10',
    readTime: '5 min read',
  },
  {
    slug: 'whatsapp-bot-travel-agency',
    title: 'How to Set Up a WhatsApp Chatbot for Your Travel Agency in 2026',
    excerpt:
      'A step-by-step guide to automating WhatsApp enquiries so your agency captures and qualifies leads 24/7 — even when you\'re offline.',
    date: '2026-04-03',
    readTime: '7 min read',
  },
  {
    slug: 'travel-lead-management',
    title: 'The Ultimate Guide to Travel Lead Management for Indian Agencies',
    excerpt:
      'From Meta Ads to WhatsApp to referrals — how to capture, track, and convert every travel enquiry into a confirmed booking.',
    date: '2026-03-27',
    readTime: '9 min read',
  },
  {
    slug: 'travel-crm-vs-leadsquared',
    title: 'Yatrik vs LeadSquared: Which CRM Is Right for Your Travel Agency?',
    excerpt:
      'An honest, feature-by-feature comparison of the two most popular CRM options for Indian travel agencies in 2026.',
    date: '2026-03-20',
    readTime: '6 min read',
  },
];

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Travel Agency Growth — Tips, Guides & CRM Insights
        </h1>
        <p className="text-xl text-gray-600 mb-16">
          Practical advice from the team behind Yatrik, India&apos;s travel CRM software.
        </p>
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-2xl font-semibold text-gray-900 group-hover:text-blue-600 transition mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-500 text-sm mb-3">
                {new Date(post.date).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                · {post.readTime}
              </p>
              <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-blue-600 font-medium hover:underline"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
