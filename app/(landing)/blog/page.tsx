import type { Metadata } from 'next';
import Link from 'next/link';
import { platformBlogPosts } from '@/lib/platform-blog';

export const metadata: Metadata = {
  title: 'Blog - Travel Agency Growth Tips & CRM Guides',
  description:
    'Practical guides for Indian travel agencies: lead management, WhatsApp automation, Meta Ads tips, and CRM best practices from the Yatrik team.',
  alternates: { canonical: 'https://travelycrm.reviu.store/blog' },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Travel Agency Growth - Tips, Guides & CRM Insights
        </h1>
        <p className="text-xl text-gray-600 mb-16">
          Practical advice from the team behind Yatrik, India&apos;s travel CRM software.
        </p>
        <div className="space-y-12">
          {platformBlogPosts.map((post) => (
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
                / {post.readTime}
              </p>
              <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block mt-4 text-blue-600 font-medium hover:underline"
              >
                Read article
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
